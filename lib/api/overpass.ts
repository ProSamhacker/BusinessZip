/**
 * OpenStreetMap Overpass API integration
 * Fetches competitor data for a given zip code and business type
 */

export interface CompetitorLocation {
  lat: number;
  lon: number;
}

export interface CompetitorData {
  count: number;
  locations?: CompetitorLocation[];
}

// Map business terms to OSM amenity tags
const businessTypeMap: Record<string, string> = {
  'coffee shop': 'cafe',
  'coffee': 'cafe',
  'cafe': 'cafe',
  'coffeeshop': 'cafe',
  'coffeehouse': 'cafe',
  'restaurant': 'restaurant',
  'restaurants': 'restaurant',
  'dining': 'restaurant',
  'gym': 'gym',
  'fitness': 'gym',
  'fitness center': 'gym',
  'fitnesscentre': 'gym',
  'bookstore': 'library',
  'book store': 'library',
  'books': 'library',
  'pharmacy': 'pharmacy',
  'pharmacies': 'pharmacy',
  'drugstore': 'pharmacy',
  'gas station': 'fuel',
  'gas': 'fuel',
  'fuel': 'fuel',
  'gasoline': 'fuel',
  'hotel': 'hotel',
  'hotels': 'hotel',
  'bank': 'bank',
  'banks': 'bank',
  'supermarket': 'supermarket',
  'grocery': 'supermarket',
  'grocery store': 'supermarket',
  'groceries': 'supermarket',
  'bar': 'bar',
  'bars': 'bar',
  'pub': 'bar',
  'pubs': 'bar',
  'clinic': 'clinic',
  'clinics': 'clinic',
  'hospital': 'hospital',
  'hospitals': 'hospital',
};

/**
 * Fuzzy search for business type - finds closest match in businessTypeMap
 * Uses simple string similarity (Levenshtein-like approach)
 */
function findClosestMatch(term: string): string | null {
  const normalized = term.toLowerCase().trim();
  
  // Exact match
  if (businessTypeMap[normalized]) {
    return businessTypeMap[normalized];
  }
  
  // Remove common words and try again
  const cleaned = normalized
    .replace(/\b(shop|store|center|centre|place|location)\b/g, '')
    .trim();
  
  if (cleaned && businessTypeMap[cleaned]) {
    return businessTypeMap[cleaned];
  }
  
  // Try partial matches (contains)
  for (const [key, value] of Object.entries(businessTypeMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Try word-by-word matching
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length > 2) { // Ignore very short words
      for (const [key, value] of Object.entries(businessTypeMap)) {
        if (key.includes(word) || word.includes(key)) {
          return value;
        }
      }
    }
  }
  
  return null;
}

function getAmenityTag(businessTerm: string): string {
  const match = findClosestMatch(businessTerm);
  if (match) {
    return match;
  }
  
  // Fallback: use normalized term (might work for some OSM tags)
  return businessTerm.toLowerCase().trim();
}

/**
 * Get competitor data by zip code (legacy method)
 */
export async function getCompetitorData(
  zipCode: string,
  businessTerm: string,
  includeLocations: boolean = false
): Promise<CompetitorData> {
  try {
    const amenity = getAmenityTag(businessTerm);
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // First, get the area ID for the zip code
    const areaQuery = `
      [out:json];
      relation["postal_code"="${zipCode}"];
      out body;
    `;
    
    const areaRes = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(areaQuery)}`,
    });
    
    if (!areaRes.ok) {
      throw new Error('Failed to fetch area data from Overpass API');
    }
    
    const areaData = await areaRes.json();
    
    if (!areaData.elements || areaData.elements.length === 0) {
      return { count: 0, locations: [] };
    }
    
    const areaId = areaData.elements[0].id;
    
    // Now query for businesses in that area
    let businessQuery: string;
    
    if (includeLocations) {
      // Get locations for map display
      businessQuery = `
        [out:json];
        area(${areaId});
        (
          node["amenity"="${amenity}"](area);
          way["amenity"="${amenity}"](area);
        );
        out geom;
      `;
    } else {
      // Just get count
      businessQuery = `
        [out:json];
        area(${areaId});
        (
          node["amenity"="${amenity}"](area);
          way["amenity"="${amenity}"](area);
        );
        out count;
      `;
    }
    
    const businessRes = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(businessQuery)}`,
    });
    
    if (!businessRes.ok) {
      throw new Error('Failed to fetch competitor data from Overpass API');
    }
    
    const businessData = await businessRes.json();
    
    if (includeLocations && businessData.elements) {
      const locations: CompetitorLocation[] = businessData.elements
        .map((element: any) => {
          if (element.type === 'node') {
            return { lat: element.lat, lon: element.lon };
          } else if (element.type === 'way' && element.geometry) {
            // For ways, use the first point
            const firstPoint = element.geometry[0];
            return { lat: firstPoint.lat, lon: firstPoint.lon };
          }
          return null;
        })
        .filter((loc: CompetitorLocation | null) => loc !== null);
      
      return {
        count: locations.length,
        locations,
      };
    }
    
    // Parse count from response
    const count = businessData.elements?.length || 0;
    
    return {
      count,
      locations: includeLocations ? [] : undefined,
    };
  } catch (error) {
    console.error('Error fetching competitor data:', error);
    // Re-throw the error so the calling code can handle it properly
    throw error instanceof Error ? error : new Error('Failed to fetch competitor data from Overpass API');
  }
}

/**
 * Get competitor data by radius (coordinates + radius in meters)
 * This is the superior method compared to zip code boundary search
 * 
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @param radiusMeters - Radius in meters (default: 1609 = 1 mile)
 * @param businessTerm - Business type to search for
 * @param includeLocations - Whether to include location coordinates
 */
export async function getCompetitorDataByRadius(
  lat: number,
  lon: number,
  radiusMeters: number,
  businessTerm: string,
  includeLocations: boolean = false
): Promise<CompetitorData> {
  try {
    const amenity = getAmenityTag(businessTerm);
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // Use Overpass 'around' query for radius-based search
    // Format: (around:radius,lat,lon)
    let businessQuery: string;
    
    if (includeLocations) {
      // Get locations for map display
      businessQuery = `
        [out:json];
        (
          node["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});
          way["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});
        );
        out geom;
      `;
    } else {
      // Just get count
      businessQuery = `
        [out:json];
        (
          node["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});
          way["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});
        );
        out count;
      `;
    }
    
    const businessRes = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(businessQuery)}`,
    });
    
    if (!businessRes.ok) {
      throw new Error('Failed to fetch competitor data from Overpass API');
    }
    
    const businessData = await businessRes.json();
    
    if (includeLocations && businessData.elements) {
      const locations: CompetitorLocation[] = businessData.elements
        .map((element: any) => {
          if (element.type === 'node') {
            return { lat: element.lat, lon: element.lon };
          } else if (element.type === 'way' && element.geometry) {
            // For ways, use the first point
            const firstPoint = element.geometry[0];
            return { lat: firstPoint.lat, lon: firstPoint.lon };
          }
          return null;
        })
        .filter((loc: CompetitorLocation | null) => loc !== null);
      
      return {
        count: locations.length,
        locations,
      };
    }
    
    // Parse count from response
    const count = businessData.elements?.length || 0;
    
    return {
      count,
      locations: includeLocations ? [] : undefined,
    };
  } catch (error) {
    console.error('Error fetching competitor data by radius:', error);
    // Re-throw the error so the calling code can handle it properly
    throw error instanceof Error ? error : new Error('Failed to fetch competitor data from Overpass API');
  }
}

