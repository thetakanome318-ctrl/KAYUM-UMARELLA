import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { ROWRecord } from '../types';
import { MonthlyTargetItem } from '../utils/targetStorage';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfigData.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

const RECORDS_COLLECTION = 'records';
const TARGETS_COLLECTION = 'monthlyTargets';

// Real-time listener for records
export function subscribeRecords(onUpdate: (records: ROWRecord[]) => void) {
  const recordsRef = collection(db, RECORDS_COLLECTION);
  return onSnapshot(recordsRef, (snapshot) => {
    const list: ROWRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ROWRecord);
    });
    onUpdate(list);
  }, (error) => {
    console.error('Error listening to Firestore records:', error);
  });
}

// Real-time listener for monthly targets
export function subscribeMonthlyTargets(onUpdate: (targetsMap: Record<string, MonthlyTargetItem>) => void) {
  const targetsRef = collection(db, TARGETS_COLLECTION);
  return onSnapshot(targetsRef, (snapshot) => {
    const map: Record<string, MonthlyTargetItem> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as MonthlyTargetItem;
      if (data.bulanKey) {
        map[data.bulanKey] = data;
      }
    });
    onUpdate(map);
  }, (error) => {
    console.error('Error listening to Firestore targets:', error);
  });
}

// Save or Update a single record in Firestore
export async function saveRecordToCloud(record: ROWRecord): Promise<void> {
  try {
    const docRef = doc(db, RECORDS_COLLECTION, record.id);
    await setDoc(docRef, {
      ...record,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save record to cloud:', error);
    throw error;
  }
}

// Delete a record in Firestore
export async function deleteRecordFromCloud(recordId: string): Promise<void> {
  try {
    const docRef = doc(db, RECORDS_COLLECTION, recordId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete record from cloud:', error);
    throw error;
  }
}

// Save initial/batch records to Cloud (Seed or Sync)
export async function syncAllRecordsToCloud(records: ROWRecord[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    records.forEach((record) => {
      const docRef = doc(db, RECORDS_COLLECTION, record.id);
      batch.set(docRef, {
        ...record,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Failed to batch sync records to cloud:', error);
  }
}

// Save a monthly target item to Cloud
export async function saveMonthlyTargetToCloud(target: MonthlyTargetItem): Promise<void> {
  try {
    const docRef = doc(db, TARGETS_COLLECTION, target.bulanKey);
    await setDoc(docRef, {
      ...target,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save monthly target to cloud:', error);
    throw error;
  }
}

// Seed initial targets map to Cloud
export async function syncAllTargetsToCloud(targetsMap: Record<string, MonthlyTargetItem>): Promise<void> {
  try {
    const batch = writeBatch(db);
    Object.values(targetsMap).forEach((target) => {
      const docRef = doc(db, TARGETS_COLLECTION, target.bulanKey);
      batch.set(docRef, {
        ...target,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Failed to sync targets to cloud:', error);
  }
}
