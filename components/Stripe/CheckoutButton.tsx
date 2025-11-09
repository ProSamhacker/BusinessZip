'use client';

import { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getStripe } from '@/lib/stripe/config';
import AuthModal from '@/components/Auth/AuthModal';
import type { Stripe } from '@stripe/stripe-js';

interface CheckoutButtonProps {
  priceId?: string;
}

export default function CheckoutButton({ priceId }: CheckoutButtonProps) {
  const { user, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (userData?.subscriptionTier === 'pro' && userData?.proStatus === 'active') {
      alert('You already have an active Pro subscription!');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        alert('Error: ' + error);
        return;
      }

      const stripe = await getStripe();
      if (!stripe) {
        alert('Stripe is not configured. Please contact support.');
        return;
      }

      // redirectToCheckout exists on Stripe instance but may not be in types
      // Using type assertion to access the method
      type StripeWithRedirect = Stripe & {
        redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message: string } }>;
      };
      
      const result = await (stripe as StripeWithRedirect).redirectToCheckout({ sessionId });
      if (result?.error) {
        alert('Error redirecting to checkout: ' + result.error.message);
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Upgrade to Pro'}
      </button>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}

