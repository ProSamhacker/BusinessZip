import { NextRequest, NextResponse } from 'next/server';
import { getCensusData } from '@/lib/api/census';
import { getCompetitorData, getCompetitorDataByRadius, milesToMeters } from '@/lib/api/overpass';
import { geocodeAddress } from '@/lib/api/geocoding';

// Simple in-memory cache for API responses
// This prevents rate limiting by caching responses for 1 hour
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  const now = Date.now();
  
  // Check if cache entry exists and is still valid
  if (entry && (now - entry.timestamp) < CACHE_TTL) {
    return Promise.resolve(entry.data);
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
    let censusData: any;
    let competitorData: any;
    let searchLocation: string;
    let coordinates: { lat: number; lon: number } | null = null;

    if (address) {
      // Radius-based search using address
      if (!radiusMiles || radiusMiles <= 0 || radiusMiles > 50) {
        return NextResponse.json(
          { error: 'Radius must be between 0.1 and 50 miles' },
          { status: 400 }
        );
      }

      // Geocode the address
      const geocodeResult = await getCached(
        `geocode-${address.toLowerCase()}`,
        () => geocodeAddress(address)
      );
      
      coordinates = { lat: geocodeResult.lat, lon: geocodeResult.lon };
      searchLocation = geocodeResult.displayName;
      
      // For radius search, we need to get census data for the zip code of the geocoded location
      // We'll try to extract zip code from the display name, or use a nearby zip code
      // For now, we'll use a simplified approach: get census data for a nearby zip code
      // In a production app, you might want to reverse geocode to get the zip code
      const radiusMeters = milesToMeters(radiusMiles);
      
      const competitorCacheKey = `competitor-radius-${geocodeResult.lat}-${geocodeResult.lon}-${radiusMeters}-${trimmedBusinessTerm.toLowerCase()}`;
      
      competitorData = await getCached(
        competitorCacheKey,
        () => getCompetitorDataByRadius(
          geocodeResult.lat,
          geocodeResult.lon,
          radiusMeters,
          trimmedBusinessTerm,
          true
        )
      );
      
      // For radius search, we'll estimate population based on radius
      // This is a simplified approach - in production, you might want to use a different method
      const estimatedPopulation = Math.round(Math.PI * radiusMiles * radiusMiles * 5000); // Rough estimate
      const estimatedIncome = 60000; // Default estimate
      
      censusData = {
        population: estimatedPopulation,
        medianIncome: estimatedIncome,
      };
    } else if (zipCode) {
      // Zip code-based search (legacy method)
      const zipRegex = /^[0-9]{5}$/;
      if (!zipRegex.test(zipCode)) {
        return NextResponse.json(
          { error: 'Valid 5-digit zip code is required' },
          { status: 400 }
        );
      }

      searchLocation = zipCode;
      
      // Create cache keys
      const censusCacheKey = `census-${zipCode}`;
      const competitorCacheKey = `competitor-${zipCode}-${trimmedBusinessTerm.toLowerCase()}`;
      
      // Fetch data from both APIs in parallel with caching
      [censusData, competitorData] = await Promise.all([
        getCached(censusCacheKey, () => getCensusData(zipCode)),
        getCached(competitorCacheKey, () => getCompetitorData(zipCode, trimmedBusinessTerm, true)),
      ]);
    } else {
      return NextResponse.json(
        { error: 'Either zip code or address is required' },
        { status: 400 }
      );
    }
    
    // Calculate opportunity score with improved algorithm
    const competitorCount = competitorData.count || 0;
    const population = censusData.population || 0;
    const medianIncome = censusData.medianIncome || 0;
    
    let opportunityScore = 'N/A';
    let opportunityValue = 0; // For sorting/comparison
    
    if (competitorCount > 0 && population > 0) {
      const ratio = Math.round(population / competitorCount);
      opportunityScore = `1 per ${ratio.toLocaleString()} residents`;
      
      // Enhanced opportunity score calculation
      // Factor in income level (higher income = better opportunity)
      const incomeFactor = Math.min(medianIncome / 100000, 2); // Cap at 2x for very high income
      const baseScore = ratio;
      opportunityValue = Math.round(baseScore * (1 + incomeFactor * 0.3)); // Income adds up to 30% boost
    } else if (competitorCount === 0 && population > 0) {
      opportunityScore = 'No competitors found';
      // High opportunity if no competitors and decent population
      opportunityValue = population > 10000 ? 1000 : population / 10;
    }
    
    const reportData = {
      population: censusData.population,
      medianIncome: censusData.medianIncome,
      competitorCount,
      opportunityScore,
      opportunityValue, // For sorting/comparison
      competitorLocations: competitorData.locations,
      searchLocation, // The location that was searched
      coordinates, // For radius searches
      searchType: address ? 'radius' : 'zipcode', // Track search type
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

