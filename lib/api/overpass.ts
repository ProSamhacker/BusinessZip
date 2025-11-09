/**
 * OpenStreetMap Overpass API integration.
 * Fetches competitor data for a given location and business type.
 */

// --- TYPE DEFINITIONS ---

export interface CompetitorLocation {
  lat: number;
  lon: number;
}

export interface CompetitorData {
  count: number;
  locations: CompetitorLocation[];
}

// Overpass API returns a complex object, so we define types for what we need.
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

// Maps common business terms to OpenStreetMap 'amenity' tags.
const businessTypeMap: Record<string, string> = {
  'coffee shop': 'cafe',
  'coffee': 'cafe',
  'cafe': 'cafe',
  'restaurant': 'restaurant',
  'gym': 'gym',
  'fitness': 'gym',
  'bookstore': 'books',
  'pharmacy': 'pharmacy',
  'drugstore': 'pharmacy',
  'gas station': 'fuel',
  'hotel': 'hotel',
  'bank': 'bank',
  'supermarket': 'supermarket',
  'grocery store': 'supermarket',
  'bar': 'bar',
  'pub': 'bar',
  'clinic': 'clinic',
  'hospital': 'hospital',
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
 * Performs a fuzzy search to find the best OSM amenity tag for a given business term.
 * @param term - The user-provided business term (e.g., "coffee place").
 * @returns The corresponding OSM amenity tag (e.g., "cafe") or a normalized version of the term.
 */
function getAmenityTag(businessTerm: string): string {
  const normalized = businessTerm.toLowerCase().trim();
  
  // 1. Exact match
  if (businessTypeMap[normalized]) {
    return businessTypeMap[normalized];
  }

  // 2. Partial match (e.g., "coffee" in "coffee shop")
  for (const [key, value] of Object.entries(businessTypeMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // 3. Fallback to the normalized term itself
  return normalized;
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
        // Use the first coordinate for a 'way' (e.g., a building outline)
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
    const amenity = getAmenityTag(businessTerm);
    
    // This query finds all nodes and ways with the specified amenity tag within the given radius.
    const query = `
      [out:json];
      (
        node["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});
        way["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});
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
    const amenity = getAmenityTag(businessTerm);

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
    
    // The area ID needs to be increased by this specific number for use in subsequent queries.
    const areaId = areaData.elements[0].id + 3600000000;

    // 2. Find all competitors within that specific area.
    const competitorQuery = `
      [out:json];
      area(${areaId});
      (
        node["amenity"="${amenity}"](area);
        way["amenity"="${amenity}"](area);
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


