'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [searchType, setSearchType] = useState<'zipcode' | 'radius'>('zipcode');
  const [businessTerm, setBusinessTerm] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessTerm.trim()) {
      alert('Please enter a business type');
      return;
    }
    
    if (searchType === 'zipcode' && !zipCode.trim()) {
      alert('Please enter a zip code');
      return;
    }
    
    if (searchType === 'radius' && !address.trim()) {
      alert('Please enter an address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (searchType === 'zipcode') {
        // Navigate to results page with zip code query params
        router.push(`/results?business=${encodeURIComponent(businessTerm)}&zip=${encodeURIComponent(zipCode)}`);
      } else {
        // Navigate to results page with address/radius query params
        router.push(`/results?business=${encodeURIComponent(businessTerm)}&address=${encodeURIComponent(address)}&radius=${radiusMiles}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Is your business idea a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              goldmine
            </span>{' '}
            or a{' '}
            <span className="text-red-600">sinkhole?</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Get instant insights on market opportunity, competition, and demographics 
            for any US location. Make data-driven decisions before you invest.
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
            {/* Search Type Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setSearchType('zipcode')}
                className={`px-4 py-2 font-semibold transition ${
                  searchType === 'zipcode'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Search by Zip Code
              </button>
              <button
                type="button"
                onClick={() => setSearchType('radius')}
                className={`px-4 py-2 font-semibold transition ${
                  searchType === 'radius'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Search by Address & Radius
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Type - Always shown */}
              <div>
                <label 
                  htmlFor="businessTerm" 
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Business Type
                </label>
                <input
                  id="businessTerm"
                  type="text"
                  value={businessTerm}
                  onChange={(e) => setBusinessTerm(e.target.value)}
                  placeholder="e.g., Coffee Shop, Gym, Restaurant"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              {/* Zip Code Search */}
              {searchType === 'zipcode' && (
                <div>
                  <label 
                    htmlFor="zipCode" 
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Zip Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g., 90210"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                    spellCheck="false"
                  />
                </div>
              )}

              {/* Address & Radius Search */}
              {searchType === 'radius' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label 
                      htmlFor="address" 
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g., 123 Main St, New York, NY 10001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a full address for best results
                    </p>
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="radiusMiles" 
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Radius (miles)
                    </label>
                    <input
                      id="radiusMiles"
                      type="number"
                      value={radiusMiles}
                      onChange={(e) => setRadiusMiles(parseFloat(e.target.value) || 1)}
                      min="0.1"
                      max="50"
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Search radius in miles (0.1 - 50)
                    </p>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Opportunity'}
              </button>
            </form>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Market Data</h3>
              <p className="text-gray-600 text-sm">
                Real demographic data from the U.S. Census Bureau
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="font-semibold text-gray-900 mb-2">Competition Analysis</h3>
              <p className="text-gray-600 text-sm">
                See how many competitors exist in your target area
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-3">💡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Opportunity Score</h3>
              <p className="text-gray-600 text-sm">
                Get an instant assessment of market potential
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">All Features Free!</h2>
            <p className="mb-6 opacity-90">
              Save reports, view interactive maps, download PDFs, and more - all completely free with no limitations.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
