import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
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
    const docRef = await addDoc(collection(db, 'savedReports'), {
      userId,
      reportName,
      searchQuery,
      reportData,
      createdAt: serverTimestamp(),
    });

    return { success: true, docId: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserReports(userId: string): Promise<SavedReport[]> {
  try {
    const q = query(collection(db, 'savedReports'), where('userId', '==', userId));
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
    await deleteDoc(doc(db, 'savedReports', reportId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

