/**
 * U.S. Census Bureau API integration
 * Fetches demographic data for a given zip code
 */

export interface CensusData {
  population: number;
  medianIncome: number;
}

export async function getCensusData(zipCode: string): Promise<CensusData> {
  try {
    // Using Census Bureau API - American Community Survey 5-Year Estimates
    // Note: You'll need to get an API key from https://api.census.gov/data/key_signup.html
    
    const apiKey = process.env.CENSUS_API_KEY || '';
    const year = '2022'; // Latest available year
    
    // Get population data
    const populationUrl = `https://api.census.gov/data/${year}/acs/acs5?get=B01001_001E&for=zip%20code%20tabulation%20area:${zipCode}&key=${apiKey}`;
    
    // Get median household income
    const incomeUrl = `https://api.census.gov/data/${year}/acs/acs5?get=B19013_001E&for=zip%20code%20tabulation%20area:${zipCode}&key=${apiKey}`;
    
    const [populationRes, incomeRes] = await Promise.all([
      fetch(populationUrl),
      fetch(incomeUrl),
    ]);
    
    if (!populationRes.ok || !incomeRes.ok) {
      throw new Error('Failed to fetch census data');
    }
    
    const [populationData, incomeData] = await Promise.all([
      populationRes.json(),
      incomeRes.json(),
    ]);
    
    // Parse response - Census API returns array with headers and data
    const population = parseInt(populationData[1]?.[0] || '0', 10);
    const medianIncome = parseInt(incomeData[1]?.[0] || '0', 10);
    
    if (population === 0 || medianIncome === 0) {
      throw new Error('Invalid or missing census data for zip code');
    }

    return {
      population,
      medianIncome,
    };
  } catch (error) {
    console.error('Error fetching census data:', error);
    // Re-throw the error so the calling code can handle it properly
    throw error instanceof Error ? error : new Error('Failed to fetch census data');
  }
}

