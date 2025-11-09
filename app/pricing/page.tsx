'use client';

import Link from 'next/link';
import CheckoutButton from '@/components/Stripe/CheckoutButton';
import { useAuth } from '@/components/Auth/AuthProvider';

export default function PricingPage() {
  const { userData } = useAuth();
  const isPro = userData?.subscriptionTier === 'pro' && userData?.proStatus === 'active';

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Unlock powerful features to make better business decisions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
            <div className="text-4xl font-bold text-gray-900 mb-4">
              $0<span className="text-lg text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Basic opportunity analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Demographic data</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Competitor count</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Opportunity score</span>
              </li>
            </ul>
            {!isPro && (
              <button
                disabled
                className="w-full py-3 bg-gray-200 text-gray-600 font-semibold rounded-lg cursor-not-allowed"
              >
                Current Plan
              </button>
            )}
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 border-2 border-purple-500 relative">
            {isPro && (
              <div className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                Current Plan
              </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
            <div className="text-4xl font-bold text-white mb-4">
              $29<span className="text-lg text-purple-100">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-white">
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Save unlimited reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Interactive competitor maps</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Download PDF reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Dashboard to compare locations</span>
              </li>
              <li className="flex items-start">
                <span className="text-white mr-2">✓</span>
                <span>Radius-based search (coming soon)</span>
              </li>
            </ul>
            {!isPro ? (
              <CheckoutButton />
            ) : (
              <button
                disabled
                className="w-full py-3 bg-white text-purple-600 font-semibold rounded-lg cursor-not-allowed opacity-75"
              >
                Active Subscription
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

