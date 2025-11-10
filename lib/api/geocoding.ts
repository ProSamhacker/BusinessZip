/**
 * Geocoding API integration
 * Converts addresses to latitude/longitude coordinates
 * Uses Nominatim (OpenStreetMap's free geocoding service)
 */

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

/**
 * Geocode an address to get latitude/longitude coordinates
 * Uses Nominatim (OpenStreetMap's free geocoding service)
 * 
 * @param address - The address to geocode (e.g., "123 Main St, New York, NY 10001")
 * @returns Promise with latitude, longitude, and display name
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    // Use Nominatim (OpenStreetMap's free geocoding service)
    // No API key required, but be respectful with rate limits
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });
    
    const response = await fetch(`${nominatimUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'LocalOpportunityAnalyzer/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Address not found. Please try a more specific address.');
    }
    
    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates returned from geocoding service');
    }
    
    return {
      lat,
      lon,
      displayName: result.display_name || address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to geocode address. Please check the address and try again.');
  }
}

/**
 * Reverse geocode coordinates to get an address
 * Useful for displaying the location on the map
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
    
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
    });
    
    const response = await fetch(`${nominatimUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'LocalOpportunityAnalyzer/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.display_name || `${lat}, ${lon}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `${lat}, ${lon}`;
  }
}

/**
 * Reverse geocode coordinates to get a zip code.
 * @param lat
 *param lon
 * @returns The 5-digit zip code, or null if not found.
 */
export async function reverseGeocodeToZip(lat: number, lon: number): Promise<string | null> {
  try {
    const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1', // Request address details
    });

    const response = await fetch(`${nominatimUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'LocalOpportunityAnalyzer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding API returned status ${response.status}`);
    }

    const data = await response.json();

    const zipCode = data?.address?.postcode;

    // Validate it's a 5-digit US zip
    if (zipCode && /^[0-9]{5}$/.test(zipCode)) {
      return zipCode;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding to zip:', error);
    return null;
  }
}

