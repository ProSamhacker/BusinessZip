import { NextRequest, NextResponse } from 'next/server';
import { getCensusData } from '@/lib/api/census';
import { getCompetitorDataByRadius, milesToMeters } from '@/lib/api/overpass';
import { geocodeAddress, reverseGeocodeToZip } from '@/lib/api/geocoding';

// Simple in-memory cache for API responses
// This prevents rate limiting by caching responses for 1 hour
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  const now = Date.now();

  // Check if cache entry exists and is still valid
  if (entry && (now - entry.timestamp) < CACHE_TTL) {
    return Promise.resolve(entry.data as T);
  }

  // Fetch new data and cache it
  return fetcher().then(data => {
    cache.set(key, { data, timestamp: now });
    return data;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessTerm, zipCode, address, radiusMiles } = body;
    
    // Validate business term (required for both search types)
    if (!businessTerm) {
      return NextResponse.json(
        { error: 'Business term is required' },
        { status: 400 }
      );
    }

    const trimmedBusinessTerm = businessTerm.trim();
    if (trimmedBusinessTerm.length === 0 || trimmedBusinessTerm.length > 100) {
      return NextResponse.json(
        { error: 'Business term must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    // Determine search type: radius-based (address) or zip code
    let censusData: { population: number; medianIncome: number };
    let competitorData: { count: number; locations: Array<{ lat: number; lon: number }> };
    let searchLocation: string;
    let coordinates: { lat: number; lon: number } | null = null;
    let searchRadiusMiles: number;
    let effectiveZipCode: string | null = null;

    if (address) {
      // --- RADIUS-BASED (ADDRESS) SEARCH ---
      searchRadiusMiles = radiusMiles || 1; // Default to 1 mile if not provided
      if (searchRadiusMiles <= 0 || searchRadiusMiles > 50) {
        return NextResponse.json(
          { error: 'Radius must be between 0.1 and 50 miles' },
          { status: 400 }
        );
      }

      // 1. Geocode the address
      const geocodeResult = await getCached(
        `geocode-${address.toLowerCase()}`,
        () => geocodeAddress(address)
      );

      coordinates = { lat: geocodeResult.lat, lon: geocodeResult.lon };
      searchLocation = geocodeResult.displayName;

      // 2. Find zip code for census data
      effectiveZipCode = await getCached(
        `reverse-geocode-${coordinates!.lat}-${coordinates!.lon}`,
        () => reverseGeocodeToZip(coordinates!.lat, coordinates!.lon)
      );

      if (!effectiveZipCode) {
        throw new Error('Could not determine zip code from the provided address. Please try a zip code search instead.');
      }

    } else if (zipCode) {
      // --- ZIP CODE-BASED SEARCH ---
      const zipRegex = /^[0-9]{5}$/;
      if (!zipRegex.test(zipCode)) {
        return NextResponse.json(
          { error: 'Valid 5-digit zip code is required' },
          { status: 400 }
        );
      }

      searchLocation = `Zip Code ${zipCode}`;
      searchRadiusMiles = 2; // Default to 2-mile radius for zip code searches
      effectiveZipCode = zipCode;

      // 1. Geocode the zip code to get its center point
      const geocodeResult = await getCached(
        `geocode-${zipCode}`,
        () => geocodeAddress(zipCode)
      );
      coordinates = { lat: geocodeResult.lat, lon: geocodeResult.lon };

    } else {
      return NextResponse.json(
        { error: 'Either zip code or address is required' },
        { status: 400 }
      );
    }

    // --- DATA FETCHING (UNIFIED) ---
    // Now that we have coordinates, a radius, and an effectiveZipCode, we fetch data.

    if (!coordinates) {
      throw new Error('Could not determine search coordinates.');
    }

    const radiusMeters = milesToMeters(searchRadiusMiles);

    // Create cache keys
    const censusCacheKey = `census-${effectiveZipCode}`;
    const competitorCacheKey = `competitor-radius-${coordinates.lat}-${coordinates.lon}-${radiusMeters}-${trimmedBusinessTerm.toLowerCase()}`;

    // Fetch data from both APIs in parallel with caching
    [censusData, competitorData] = await Promise.all([
      getCached(censusCacheKey, () => getCensusData(effectiveZipCode!)),
      getCached(competitorCacheKey, () => getCompetitorDataByRadius(
          coordinates.lat,
          coordinates.lon,
          radiusMeters,
          trimmedBusinessTerm
        )
      ),
    ]);
    
    // Calculate opportunity score with improved algorithm
    const competitorCount = competitorData.count || 0;
    const population = censusData.population || 0;
    const medianIncome = censusData.medianIncome || 0;
    
    // --- OPPORTUNITY SCORE (UNIFIED) ---
    let opportunityScore = 'N/A';
    let opportunityValue = 0; // For sorting/comparison

    if (competitorCount > 0 && population > 0) {
      const ratio = Math.round(population / competitorCount);
      opportunityScore = `1 per ${ratio.toLocaleString()} residents`;

      const incomeFactor = Math.min(medianIncome / 100000, 2);
      const baseScore = ratio;
      opportunityValue = Math.round(baseScore * (1 + incomeFactor * 0.3));
    } else if (competitorCount === 0 && population > 0) {
      opportunityScore = 'No competitors found';
      opportunityValue = population > 10000 ? 100000 : population * 10; // Use a large value
    }
    
    const reportData = {
      population: censusData.population,
      medianIncome: censusData.medianIncome,
      competitorCount,
      opportunityScore,
      opportunityValue,
      competitorLocations: competitorData.locations,
      searchLocation,
      coordinates,
      searchType: address ? 'radius' : 'zipcode',
    };
    
    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error in analyze route:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to analyze location';
    
    // Check if it's a known error type
    if (errorMessage.includes('census')) {
      return NextResponse.json(
        { error: 'Unable to fetch demographic data. Please verify the zip code is valid.' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('Overpass') || errorMessage.includes('competitor')) {
      return NextResponse.json(
        { error: 'Unable to fetch competitor data. The service may be temporarily unavailable.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to analyze location. Please try again.' },
      { status: 500 }
    );
  }
}

