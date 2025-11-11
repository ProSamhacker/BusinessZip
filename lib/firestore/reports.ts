import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { SavedReport, SearchQuery, ReportData } from '../firebase/types';

export async function saveReport(
  userId: string,
  reportName: string,
  searchQuery: SearchQuery,
  reportData: ReportData
): Promise<{ success: boolean; error?: string; docId?: string }> {
  try {
    if (!db) {
      console.error('saveReport: Firestore is not initialized');
      return { success: false, error: 'Firestore is not initialized. This function must be called on the client side.' };
    }

    console.log('saveReport: Starting save operation', { userId, reportName });

    // Clean searchQuery to remove undefined fields, as Firestore doesn't allow undefined values
    const cleanSearchQuery = Object.fromEntries(
      Object.entries(searchQuery).filter(([_, value]) => value !== undefined)
    );

    // Clean reportData to remove undefined fields, as Firestore doesn't allow undefined values
    const cleanReportData = Object.fromEntries(
      Object.entries(reportData).filter(([_, value]) => value !== undefined)
    );

    console.log('saveReport: Cleaned data prepared', {
      searchQuery: cleanSearchQuery,
      reportDataKeys: Object.keys(cleanReportData)
    });

    const docRef = await addDoc(collection(db, 'savedReports'), {
      userId,
      reportName,
      searchQuery: cleanSearchQuery,
      reportData: cleanReportData,
      createdAt: serverTimestamp(),
    });

    console.log('saveReport: Successfully saved report', { docId: docRef.id });
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('saveReport: Error saving report', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function getUserReports(userId: string): Promise<SavedReport[]> {
  try {
    if (!db) {
      console.error('Firestore is not initialized');
      return [];
    }
    
    const q = query(
      collection(db, 'savedReports'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      docId: doc.id,
      ...doc.data(),
    })) as SavedReport[];
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }
}

export async function deleteReport(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!db) {
      return { success: false, error: 'Firestore is not initialized. This function must be called on the client side.' };
    }
    
    await deleteDoc(doc(db, 'savedReports', reportId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

