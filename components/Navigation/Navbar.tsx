'use client';

import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import { signOut } from '@/lib/firebase/auth';
import { useState } from 'react';
import AuthModal from '@/components/Auth/AuthModal';

export default function Navbar() {
  const { user, userData } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/'; // <-- ADD THIS LINE
  };

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              BusinessZip
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {userData?.displayName || user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
