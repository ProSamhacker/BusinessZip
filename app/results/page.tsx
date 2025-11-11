'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import AuthModal from '@/components/Auth/AuthModal';
import { saveReport } from '@/lib/firestore/reports';
import CompetitorMap from '@/components/Map/CompetitorMapClient';
import { downloadReportAsPDF } from '@/lib/utils/pdf';
import { Bot, BarChart2, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react'; // <-- ADD ICONS
import ReportCharts from '@/components/Charts/ReportCharts'; // <-- ADD CHART IMPORT

// --- UPDATE ReportData INTERFACE ---
interface ReportData {
  population: number;
  medianIncome: number;
  competitorCount: number;
  opportunityScore: string;
  competitorLocations?: Array<{ lat: number; lon: number }>;
  geminiSummary: string;
  incomeLevel: string;
  marketSaturation: string;
  incomeData: { name: string; 'Your Location': number; 'US Average': number }[];
  populationData: { name: string; 'Your Location': number; 'US Average': number }[];
  searchLocation: string; // <-- Add this
  opportunityValue?: number; // <-- Add this
  searchType?: 'zipcode' | 'radius'; // <-- Add this
}
// --- END UPDATE ---

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const businessTerm = searchParams.get('business') || '';
  const zipCode = searchParams.get('zip') || '';
  const address = searchParams.get('address') || '';
  const radius = searchParams.get('radius') || '';

  useEffect(() => {
    if (!businessTerm || (!zipCode && !address)) {
      router.push('/');
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            zipCode
              ? { businessTerm, zipCode }
              : { businessTerm, address, radiusMiles: parseFloat(radius) }
          ),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

        fetchAnalysis();
  }, [businessTerm, zipCode, address, radius, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to fetch analysis data'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // --- ADD HELPER FOR STYLING ---
  const getScoreColor = (saturation: string) => {
    switch (saturation) {
      case 'Underserved':
        return 'text-green-600 border-green-500';
      case 'Saturated':
        return 'text-red-600 border-red-500';
      default:
        return 'text-blue-600 border-blue-500';
    }
  };
  // --- END ADD ---

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Search
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Opportunity Analysis Report
          </h1>
          <p className="text-gray-600 text-lg"> {/* <-- Make text larger */}
            <span className="font-semibold">{businessTerm}</span>{' '}
            {/* Use searchLocation for a clean title */}
            in <span className="font-semibold">{reportData.searchLocation}</span>
          </p>
        </div>

        {/* --- NEW: AI Summary --- */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Bot size={28} />
            <h2 className="text-2xl font-bold">Gemini AI Executive Summary</h2>
          </div>
          <p className="text-lg opacity-90">
            {reportData.geminiSummary}
          </p>
        </div>
        {/* --- END NEW --- */}


        {/* --- UPDATED: Report Card --- */}
        <div id="report-content" className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Population */}
            <div className={`pl-4 border-l-4 border-blue-500`}>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Users size={16} /> Total Population
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.population.toLocaleString()}
              </div>
            </div>

            {/* Median Income */}
            <div className={`pl-4 border-l-4 ${
                reportData.incomeLevel === 'High' ? 'border-green-500' :
                reportData.incomeLevel === 'Low' ? 'border-orange-500' : 'border-blue-500'
              }`}>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <DollarSign size={16} /> Median Household Income
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${reportData.medianIncome.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${
                reportData.incomeLevel === 'High' ? 'text-green-600' :
                reportData.incomeLevel === 'Low' ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {reportData.incomeLevel} Income Area
              </div>
            </div>

            {/* Competitor Count */}
            <div className="pl-4 border-l-4 border-orange-500">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <AlertTriangle size={16} /> Competitors Found
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.competitorCount}
              </div>
            </div>

            {/* Opportunity Score */}
            <div className={`pl-4 border-l-4 ${getScoreColor(reportData.marketSaturation)}`}>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <TrendingUp size={16} /> Opportunity Score
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(reportData.marketSaturation)}`}>
                {reportData.opportunityScore}
              </div>
              <div className={`text-sm font-medium ${getScoreColor(reportData.marketSaturation)}`}>
                {reportData.marketSaturation} Market
              </div>
            </div>
          </div>
        </div>
        {/* --- END UPDATE --- */}


        {/* --- NEW: Charts --- */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
           <div className="flex items-center gap-3 mb-6">
            <BarChart2 size={28} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Data Visualization</h2>
          </div>
          <ReportCharts
            incomeData={reportData.incomeData}
            populationData={reportData.populationData}
          />
        </div>
        {/* --- END NEW --- */}


        {/* --- UPDATED: Interpretation --- */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What This Means</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Population:</strong> The total number of residents in this area.
              A larger population typically means more potential customers.
            </p>
            <p>
              <strong>Median Income:</strong> The middle household income level. Higher income
              areas may support premium pricing and higher spending.
            </p>
            <p>
              <strong>Competitors:</strong> The number of similar businesses already operating
              in this area. Fewer competitors may indicate less saturation.
            </p>
            <p>
              <strong>Opportunity Score:</strong> This shows the ratio of residents per competitor.
              A higher number suggests less competition per potential customer.
            </p>
          </div>
        </div>
        {/* --- END UPDATE --- */}

        {/* ... (keep Map section) ... */}

        {/* ... (keep Save Report section, it's already updated) ... */}

        {/* ... (keep AuthModal) ... */}

        {/* ... (keep Affiliate Links section) ... */}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
