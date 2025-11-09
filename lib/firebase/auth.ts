import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from './types';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string, displayName: string) {
  try {
    if (!auth || !db) {
      return { user: null, error: 'Firebase is not initialized. This function must be called on the client side.' };
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName || user.displayName || '',
      subscriptionTier: 'free',
      proStatus: 'inactive',
      createdAt: serverTimestamp(),
    });
    
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase is not initialized. This function must be called on the client side.' };
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signInWithGoogle() {
  try {
    if (!auth || !db) {
      return { user: null, error: 'Firebase is not initialized. This function must be called on the client side.' };
    }
    
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if user document exists, create if not
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        subscriptionTier: 'free',
        proStatus: 'inactive',
        createdAt: serverTimestamp(),
      });
    }
    
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signOut() {
  try {
    if (!auth) {
      return { error: 'Firebase is not initialized. This function must be called on the client side.' };
    }
    
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getUserData(uid: string): Promise<User | null> {
  try {
    if (!db) {
      console.error('Firestore is not initialized');
      return null;
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { docId: uid, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

