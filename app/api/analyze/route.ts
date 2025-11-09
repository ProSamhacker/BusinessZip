import { NextRequest, NextResponse } from 'next/server';
import { getCensusData } from '@/lib/api/census';
import { getCompetitorData } from '@/lib/api/overpass';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessTerm, zipCode, includeLocations = false } = body;
    
    if (!businessTerm || !zipCode) {
      return NextResponse.json(
        { error: 'Business term and zip code are required' },
        { status: 400 }
      );
    }
    
    // Fetch data from both APIs in parallel
    const [censusData, competitorData] = await Promise.all([
      getCensusData(zipCode),
      getCompetitorData(zipCode, businessTerm, includeLocations),
    ]);
    
    // Calculate opportunity score
    const competitorCount = competitorData.count || 0;
    const population = censusData.population || 0;
    
    let opportunityScore = 'N/A';
    if (competitorCount > 0 && population > 0) {
      const ratio = Math.round(population / competitorCount);
      opportunityScore = `1 per ${ratio.toLocaleString()} residents`;
    } else if (competitorCount === 0 && population > 0) {
      opportunityScore = 'No competitors found';
    }
    
    const reportData = {
      population: censusData.population,
      medianIncome: censusData.medianIncome,
      competitorCount,
      opportunityScore,
      competitorLocations: competitorData.locations,
    };
    
    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze location' },
      { status: 500 }
    );
  }
}

