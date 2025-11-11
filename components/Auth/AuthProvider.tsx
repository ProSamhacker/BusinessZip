'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/auth';
import { User } from '@/lib/firebase/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        setUser(firebaseUser);

        // Check if user doc exists.
        const data = await getUserData(firebaseUser.uid);

        if (data) {
          // User exists, set their data.
          setUserData(data);
        } else {
          // User is NEW. Create their document.
          if (!db) {
            console.error('Firestore is not initialized');
            return;
          }
          try {
            const newUserDoc = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              createdAt: serverTimestamp(), // Make sure serverTimestamp is imported from 'firebase/firestore'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
            setUserData({
              docId: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
            });
          } catch (error) {
            console.error("Failed to create user document:", error);
            // Handle error (e.g., sign out the user)
          }
        }
      } else {
        // User is signed out.
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

