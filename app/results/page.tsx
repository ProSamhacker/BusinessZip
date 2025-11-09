'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import AuthModal from '@/components/Auth/AuthModal';
import { saveReport } from '@/lib/firestore/reports';
import CompetitorMap from '@/components/Map/CompetitorMapClient';
import { downloadReportAsPDF } from '@/lib/utils/pdf';

interface ReportData {
  population: number;
  medianIncome: number;
  competitorCount: number;
  opportunityScore: string;
  competitorLocations?: Array<{ lat: number; lon: number }>;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const businessTerm = searchParams.get('business') || '';
  const zipCode = searchParams.get('zip') || '';
  const isPro = userData?.subscriptionTier === 'pro' && userData?.proStatus === 'active';

  useEffect(() => {
    if (!businessTerm || !zipCode) {
      router.push('/');
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const currentIsPro = userData?.subscriptionTier === 'pro' && userData?.proStatus === 'active';
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessTerm,
            zipCode,
            includeLocations: currentIsPro, // Pro tier gets locations for map
          }),
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
  }, [businessTerm, zipCode, router, userData]);

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
          <p className="text-gray-600">
            <span className="font-semibold">{businessTerm}</span> in zip code{' '}
            <span className="font-semibold">{zipCode}</span>
          </p>
        </div>

        {/* Report Card */}
        <div id="report-content" className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Population */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-gray-600 mb-1">Total Population</div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.population.toLocaleString()}
              </div>
            </div>

            {/* Median Income */}
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-gray-600 mb-1">Median Household Income</div>
              <div className="text-3xl font-bold text-gray-900">
                ${reportData.medianIncome.toLocaleString()}
              </div>
            </div>

            {/* Competitor Count */}
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="text-sm text-gray-600 mb-1">Competitors Found</div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.competitorCount}
              </div>
            </div>

            {/* Opportunity Score */}
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm text-gray-600 mb-1">Opportunity Score</div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.opportunityScore}
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What This Means</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Population:</strong> The total number of residents in this zip code. 
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

        {/* Pro Feature: Map */}
        {isPro && reportData?.competitorLocations && reportData.competitorLocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Competitor Locations Map
            </h2>
            <CompetitorMap
              locations={reportData.competitorLocations}
              businessTerm={businessTerm}
            />
          </div>
        )}

        {/* CTA to Sign Up or Save Report */}
        {!user ? (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">Want to save this report?</h2>
            <p className="mb-6 opacity-90">
              Sign up for free to save reports, compare locations, and unlock Pro features like 
              interactive maps and PDF downloads.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Sign Up Free
            </button>
          </div>
        ) : isPro && reportData ? (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 space-y-4">
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  if (!user || !reportData) return;
                  setIsSaving(true);
                  const reportName = `${businessTerm} in ${zipCode}`;
                  const result = await saveReport(
                    user.uid,
                    reportName,
                    {
                      type: 'zipcode',
                      businessTerm,
                      value: zipCode,
                    },
                    reportData
                  );
                  if (result.success) {
                    alert('Report saved successfully!');
                  } else {
                    alert('Failed to save report: ' + result.error);
                  }
                  setIsSaving(false);
                }}
                disabled={isSaving}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Report'}
              </button>
              <button
                onClick={async () => {
                  try {
                    const filename = `${businessTerm}-${zipCode}-report.pdf`;
                    await downloadReportAsPDF('report-content', filename);
                  } catch (error) {
                    alert('Failed to download PDF. Please try again.');
                  }
                }}
                className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
              >
                Download PDF
              </button>
            </div>
            <Link
              href="/dashboard"
              className="block text-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Saved Reports →
            </Link>
          </div>
        ) : user && !isPro ? (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">Upgrade to Pro</h2>
            <p className="mb-6 opacity-90">
              Unlock interactive maps, PDF downloads, and save unlimited reports.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Upgrade Now
            </Link>
          </div>
        ) : null}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            // Refresh page or update UI after successful auth
            window.location.reload();
          }}
        />

        {/* Affiliate Links Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="space-y-3">
            <a
              href="https://www.legalzoom.com/business/llc/llc-overview.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="font-semibold text-gray-900">Incorporate Your LLC</div>
              <div className="text-sm text-gray-600">Protect your personal assets and establish your business</div>
            </a>
            <a
              href="https://www.namecheap.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="font-semibold text-gray-900">Get a Domain Name</div>
              <div className="text-sm text-gray-600">Secure your online presence with a professional domain</div>
            </a>
            <a
              href="https://squareup.com/us/en/point-of-sale"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="font-semibold text-gray-900">Set Up Point of Sale</div>
              <div className="text-sm text-gray-600">Accept payments and manage your business</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

