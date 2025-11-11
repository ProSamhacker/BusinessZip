/**
 * OpenStreetMap Overpass API integration.
 * Fetches competitor data for a given location and business type.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// --- TYPE DEFINITIONS ---

export interface CompetitorLocation {
  lat: number;
  lon: number;
}

export interface CompetitorData {
  count: number;
  locations: CompetitorLocation[];
}

interface OverpassElement {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}


// --- CONFIGURATION ---

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// *** FIX ***
// Maps common business terms to OpenStreetMap tags.
// The new structure is: [tagKey, tagValue]
const businessTypeMap: Record<string, [string, string]> = {
  'coffee shop': ['amenity', 'cafe'],
  'coffee': ['amenity', 'cafe'],
  'cafe': ['amenity', 'cafe'],
  'restaurant': ['amenity', 'restaurant'],
  'gym': ['leisure', 'fitness_centre'],
  'fitness': ['leisure', 'fitness_centre'],
  'fitness center': ['leisure', 'fitness_centre'],
  'bookstore': ['shop', 'books'],
  'pharmacy': ['amenity', 'pharmacy'],
  'drugstore': ['amenity', 'pharmacy'],
  'gas station': ['amenity', 'fuel'],
  'hotel': ['tourism', 'hotel'],
  'bank': ['amenity', 'bank'],
  'supermarket': ['shop', 'supermarket'],
  'grocery store': ['shop', 'supermarket'],
  'bar': ['amenity', 'bar'],
  'pub': ['amenity', 'bar'],
  'clinic': ['amenity', 'clinic'],
  'hospital': ['amenity', 'hospital'],
};


// --- HELPER FUNCTIONS ---

/**
 * Converts a distance in miles to meters for the Overpass API.
 * @param miles - The distance in miles.
 * @returns The distance in meters.
 */
export function milesToMeters(miles: number): number {
  return Math.round(miles * 1609.34);
}

/**
 * Calls Gemini API to get OSM tag for unknown business terms.
 * @param term - The business term to query.
 * @returns Promise resolving to OSM tag pair.
 */
async function getTagFromGemini(term: string): Promise<[string, string]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an expert in OpenStreetMap. A user is searching for a business.
      Convert their search term into the single most accurate OSM tag.
      Return ONLY a JSON object with "key" and "value".
      User term: "${term}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response, which might have markdown ```json
    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const tag = JSON.parse(jsonText);

    // Basic validation
    if (tag.key && tag.value) {
      return [tag.key, tag.value];
    }

    // Fallback if JSON is not as expected
    return ['amenity', term.toLowerCase()];

  } catch (error) {
    console.error("Gemini API call failed:", error);
    // Fallback if API fails
    return ['amenity', term.toLowerCase()];
  }
}

/**
 * *** FIX ***
 * Performs a fuzzy search to find the best OSM tag [key, value] for a given business term.
 * Uses hybrid approach: fast local dictionary first, then Gemini API as fallback.
 * @param term - The user-provided business term (e.g., "gym").
 * @returns Promise resolving to the corresponding OSM tag pair (e.g., ["leisure", "fitness_centre"]).
 */
async function getOsmTag(businessTerm: string): Promise<[string, string]> {
  const normalized = businessTerm.toLowerCase().trim();

  // 1. Exact match (FAST PATH)
  if (businessTypeMap[normalized]) {
    return businessTypeMap[normalized];
  }

  // 2. Partial match (FAST PATH)
  for (const [key, value] of Object.entries(businessTypeMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  // 3. No match? Call Gemini (SMART PATH)
  console.log(`No local match for ${businessTerm}, querying Gemini...`);
  const geminiTag = await getTagFromGemini(normalized);

  return geminiTag;
}

/**
 * Parses the elements from an Overpass API response into a standard format.
 * @param elements - The array of elements from the Overpass API.
 * @returns A list of competitor locations.
 */
function parseCompetitorLocations(elements: OverpassElement[]): CompetitorLocation[] {
  return elements
    .map((element) => {
      if (element.type === 'node' && element.lat && element.lon) {
        return { lat: element.lat, lon: element.lon };
      }
      if (element.type === 'way' && element.geometry && element.geometry.length > 0) {
        return { lat: element.geometry[0].lat, lon: element.geometry[0].lon };
      }
      return null;
    })
    .filter((loc): loc is CompetitorLocation => loc !== null);
}

/**
 * Executes a query against the Overpass API.
 * @param query - The Overpass QL query string.
 * @returns The parsed JSON response from the API.
 */
async function executeOverpassQuery<T>(query: string): Promise<T> {
  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}


// --- MAIN EXPORTED FUNCTIONS ---

/**
 * Fetches competitor data within a specific radius from a central point.
 * @param lat - The latitude of the search center.
 * @param lon - The longitude of the search center.
 * @param radiusMeters - The search radius in meters.
 * @param businessTerm - The type of business to search for.
 * @returns A promise that resolves to the competitor data.
 */
export async function getCompetitorDataByRadius(
  lat: number,
  lon: number,
  radiusMeters: number,
  businessTerm: string
): Promise<CompetitorData> {
  try {
    // *** FIX ***
    const [tagKey, tagValue] = await getOsmTag(businessTerm);
    
    // *** FIX ***
    // This query now uses the dynamic tagKey instead of hard-coding 'amenity'
    const query = `
      [out:json];
      (
        node["${tagKey}"="${tagValue}"](around:${radiusMeters},${lat},${lon});
        way["${tagKey}"="${tagValue}"](around:${radiusMeters},${lat},${lon});
      );
      out geom;
    `;

    const data = await executeOverpassQuery<OverpassResponse>(query);
    const locations = parseCompetitorLocations(data.elements);

    return {
      count: locations.length,
      locations,
    };
  } catch (error) {
    console.error('Error fetching competitor data by radius:', error);
    throw new Error('Failed to fetch competitor data from Overpass API.');
  }
}

/**
 * Fetches competitor data within the boundary of a given zip code.
 * NOTE: This method is less precise than radius search and is kept for legacy purposes.
 * @param zipCode - The 5-digit zip code.
 * @param businessTerm - The type of business to search for.
 * @returns A promise that resolves to the competitor data.
 */
export async function getCompetitorData(
  zipCode: string,
  businessTerm: string
): Promise<CompetitorData> {
  try {
    // *** FIX ***
    const [tagKey, tagValue] = await getOsmTag(businessTerm);

    // 1. Find the official "area" ID for the given zip code from OpenStreetMap.
    const areaQuery = `
      [out:json];
      relation["postal_code"="${zipCode}"];
      out body;
    `;
    const areaData = await executeOverpassQuery<OverpassResponse>(areaQuery);
    
    if (!areaData.elements || areaData.elements.length === 0) {
      console.warn(`No area found for zip code: ${zipCode}`);
      return { count: 0, locations: [] };
    }
    
    const areaId = areaData.elements[0].id + 3600000000;

    // 2. Find all competitors within that specific area.
    // *** FIX ***
    // This query now uses the dynamic tagKey instead of hard-coding 'amenity'
    const competitorQuery = `
      [out:json];
      area(${areaId});
      (
        node["${tagKey}"="${tagValue}"](area);
        way["${tagKey}"="${tagValue}"](area);
      );
      out geom;
    `;
    const competitorData = await executeOverpassQuery<OverpassResponse>(competitorQuery);
    const locations = parseCompetitorLocations(competitorData.elements);

    return {
      count: locations.length,
      locations,
    };
  } catch (error) {
    console.error(`Error fetching competitor data for zip ${zipCode}:`, error);
    throw new Error('Failed to fetch competitor data from Overpass API.');
  }
}