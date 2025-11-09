export interface User {
  docId: string;
  email: string;
  displayName: string;
}

export interface SearchQuery {
  type: 'zipcode' | 'radius';
  businessTerm: string;
  value: string;
  address?: string;
  radius?: number;
}

export interface ReportData {
  competitorCount: number;
  population: number;
  medianIncome: number;
  opportunityScore: string;
  opportunityValue?: number; // For sorting/comparison
  competitorLocations?: Array<{ lat: number; lon: number }>;
}

export interface SavedReport {
  docId?: string;
  userId: string;
  reportName: string;
  createdAt: Date | any;
  searchQuery: SearchQuery;
  reportData: ReportData;
}

