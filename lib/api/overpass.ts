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
  'restaurant': 'restaurant',
  'gym': 'gym',
  'fitness': 'gym',
  'bookstore': 'library',
  'book store': 'library',
  'pharmacy': 'pharmacy',
  'gas station': 'fuel',
  'gas': 'fuel',
  'hotel': 'hotel',
  'bank': 'bank',
  'supermarket': 'supermarket',
  'grocery': 'supermarket',
  'bar': 'bar',
  'pub': 'bar',
  'clinic': 'clinic',
  'hospital': 'hospital',
};

function getAmenityTag(businessTerm: string): string {
  const normalized = businessTerm.toLowerCase().trim();
  return businessTypeMap[normalized] || normalized;
}

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
    return { count: 0, locations: [] };
  }
}

