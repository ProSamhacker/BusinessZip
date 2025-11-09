import { NextRequest, NextResponse } from 'next/server';
import { getCensusData } from '@/lib/api/census';
import { getCompetitorData } from '@/lib/api/overpass';

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
    const { businessTerm, zipCode } = body;
    
    // Validate input
    if (!businessTerm || !zipCode) {
      return NextResponse.json(
        { error: 'Business term and zip code are required' },
        { status: 400 }
      );
    }

    // Validate zip code format (5 digits)
    const zipRegex = /^[0-9]{5}$/;
    if (!zipRegex.test(zipCode)) {
      return NextResponse.json(
        { error: 'Valid 5-digit zip code is required' },
        { status: 400 }
      );
    }

    // Validate business term (not empty, reasonable length)
    const trimmedBusinessTerm = businessTerm.trim();
    if (trimmedBusinessTerm.length === 0 || trimmedBusinessTerm.length > 100) {
      return NextResponse.json(
        { error: 'Business term must be between 1 and 100 characters' },
        { status: 400 }
      );
    }
    
    // Create cache keys
    const censusCacheKey = `census-${zipCode}`;
    const competitorCacheKey = `competitor-${zipCode}-${trimmedBusinessTerm.toLowerCase()}`;
    
    // Fetch data from both APIs in parallel with caching
    // This prevents rate limiting by caching responses for 1 hour
    const [censusData, competitorData] = await Promise.all([
      getCached(censusCacheKey, () => getCensusData(zipCode)),
      getCached(competitorCacheKey, () => getCompetitorData(zipCode, trimmedBusinessTerm, true)),
    ]);
    
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

