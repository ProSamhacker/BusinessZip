'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getUserReports, deleteReport } from '@/lib/firestore/reports';
import { SavedReport } from '@/lib/firebase/types';
import Link from 'next/link';
import AuthModal from '@/components/Auth/AuthModal';

export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setShowAuthModal(true);
      } else {
        loadReports();
      }
    }
  }, [user, loading]);

  const loadReports = async () => {
    if (!user) return;
    setIsLoading(true);
    const userReports = await getUserReports(user.uid);
    setReports(userReports);
    setIsLoading(false);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    const result = await deleteReport(reportId);
    if (result.success) {
      setReports(reports.filter((r) => r.docId !== reportId));
    } else {
      alert('Failed to delete report: ' + result.error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => router.push('/')}
          onSuccess={() => {
            loadReports();
            setShowAuthModal(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Search
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Saved Reports</h1>
          <p className="text-gray-600">
            All features are available - save unlimited reports and access all tools.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved reports yet</h2>
            <p className="text-gray-600 mb-6">
              Start analyzing locations and save your reports to compare them later.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Analyze a Location
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.docId}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {report.reportName}
                </h3>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business:</span>
                    <span className="font-medium">{report.searchQuery.businessTerm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{report.searchQuery.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Population:</span>
                    <span className="font-medium">
                      {report.reportData.population.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Competitors:</span>
                    <span className="font-medium">{report.reportData.competitorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-medium">{report.reportData.opportunityScore}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                                    <button
                    onClick={() => {
                      const { type, businessTerm, value, radius } = report.searchQuery;
                      let url = `/results?business=${encodeURIComponent(businessTerm)}`;
                      if (type === 'zipcode') {
                        url += `&zip=${encodeURIComponent(value)}`;
                      } else {
                        url += `&address=${encodeURIComponent(value)}&radius=${radius}`;
                      }
                      router.push(url);
                    }}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(report.docId!)}
                    className="py-2 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

