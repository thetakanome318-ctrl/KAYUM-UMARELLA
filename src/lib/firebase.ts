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
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import { ROWRecord, Penyulang, MasterSection, GangguanPangkalRecord, PemeliharaanRecord, ActivityLog } from '../types';
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

export const auth = getAuth(app);

const RECORDS_COLLECTION = 'records';
const TARGETS_COLLECTION = 'monthlyTargets';
const PENYULANG_COLLECTION = 'penyulang';
const MASTER_SECTION_COLLECTION = 'masterSection';
const GANGGUAN_PANGKAL_COLLECTION = 'gangguanPangkal';
const PEMELIHARAAN_COLLECTION = 'pemeliharaanRecords';
const ACTIVITY_LOGS_COLLECTION = 'activityLogs';

// Error Handling helper as per firebase-integration skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Sanitizes data for Firestore by removing undefined values.
 * Firestore does not support 'undefined' in its document data.
 */
function sanitizeData<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)) as any;
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value);
      }
    }
  }
  return sanitized as T;
}

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
    handleFirestoreError(error, OperationType.LIST, RECORDS_COLLECTION);
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
    handleFirestoreError(error, OperationType.LIST, TARGETS_COLLECTION);
  });
}

// Real-time listener for penyulang
export function subscribePenyulang(onUpdate: (list: Penyulang[]) => void) {
  const ref = collection(db, PENYULANG_COLLECTION);
  return onSnapshot(ref, (snapshot) => {
    const list: Penyulang[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Penyulang);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, PENYULANG_COLLECTION);
  });
}

// Save or Update a single record in Firestore
export async function saveRecordToCloud(record: ROWRecord): Promise<void> {
  const path = `${RECORDS_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, RECORDS_COLLECTION, record.id);
    const dataToSave = sanitizeData({
      ...record,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a record in Firestore
export async function deleteRecordFromCloud(recordId: string): Promise<void> {
  const path = `${RECORDS_COLLECTION}/${recordId}`;
  try {
    const docRef = doc(db, RECORDS_COLLECTION, recordId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save or Update Penyulang
export async function savePenyulangToCloud(item: Penyulang): Promise<void> {
  const path = `${PENYULANG_COLLECTION}/${item.id}`;
  try {
    const docRef = doc(db, PENYULANG_COLLECTION, item.id);
    const dataToSave = sanitizeData({
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Penyulang
export async function deletePenyulangFromCloud(id: string): Promise<void> {
  const path = `${PENYULANG_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PENYULANG_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time listener for master section
export function subscribeMasterSection(onUpdate: (list: MasterSection[]) => void) {
  const ref = collection(db, MASTER_SECTION_COLLECTION);
  return onSnapshot(ref, (snapshot) => {
    const list: MasterSection[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as MasterSection);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, MASTER_SECTION_COLLECTION);
  });
}

// Save or Update Master Section
export async function saveMasterSectionToCloud(item: MasterSection): Promise<void> {
  const path = `${MASTER_SECTION_COLLECTION}/${item.id}`;
  try {
    const docRef = doc(db, MASTER_SECTION_COLLECTION, item.id);
    const dataToSave = sanitizeData({
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Master Section
export async function deleteMasterSectionFromCloud(id: string): Promise<void> {
  const path = `${MASTER_SECTION_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, MASTER_SECTION_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save initial/batch records to Cloud (Seed or Sync)
export async function syncAllRecordsToCloud(records: ROWRecord[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    records.forEach((record) => {
      const docRef = doc(db, RECORDS_COLLECTION, record.id);
      const dataToSave = sanitizeData({
        ...record,
        updatedAt: new Date().toISOString()
      });
      batch.set(docRef, dataToSave, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, RECORDS_COLLECTION);
  }
}

// Clear all records from Cloud Firestore
export async function clearAllCloudRecords(): Promise<void> {
  try {
    const recordsRef = collection(db, RECORDS_COLLECTION);
    const snapshot = await getDocs(recordsRef);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, RECORDS_COLLECTION);
  }
}

// Save a monthly target item to Cloud
export async function saveMonthlyTargetToCloud(target: MonthlyTargetItem): Promise<void> {
  const path = `${TARGETS_COLLECTION}/${target.bulanKey}`;
  try {
    const docRef = doc(db, TARGETS_COLLECTION, target.bulanKey);
    const dataToSave = sanitizeData({
      ...target,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Seed initial targets map to Cloud
export async function syncAllTargetsToCloud(targetsMap: Record<string, MonthlyTargetItem>): Promise<void> {
  try {
    const batch = writeBatch(db);
    Object.values(targetsMap).forEach((target) => {
      const docRef = doc(db, TARGETS_COLLECTION, target.bulanKey);
      const dataToSave = sanitizeData({
        ...target,
        updatedAt: new Date().toISOString()
      });
      batch.set(docRef, dataToSave, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TARGETS_COLLECTION);
  }
}

// Real-time listener for Gangguan Pangkal Records
export function subscribeGangguanPangkal(callback: (records: GangguanPangkalRecord[]) => void): () => void {
  const collectionRef = collection(db, GANGGUAN_PANGKAL_COLLECTION);
  return onSnapshot(collectionRef, (snapshot) => {
    const list: GangguanPangkalRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as GangguanPangkalRecord);
    });
    callback(list);
  }, (error) => {
    console.error('Error listening to Gangguan Pangkal:', error);
  });
}

// Save or Update a Gangguan Pangkal record in Cloud
export async function saveGangguanPangkalToCloud(record: GangguanPangkalRecord): Promise<void> {
  const path = `${GANGGUAN_PANGKAL_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, GANGGUAN_PANGKAL_COLLECTION, record.id);
    const dataToSave = sanitizeData({
      ...record,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a Gangguan Pangkal record from Cloud
export async function deleteGangguanPangkalFromCloud(id: string): Promise<void> {
  const path = `${GANGGUAN_PANGKAL_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, GANGGUAN_PANGKAL_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time listener for Pemeliharaan Records
export function subscribePemeliharaan(callback: (records: PemeliharaanRecord[]) => void): () => void {
  const collectionRef = collection(db, PEMELIHARAAN_COLLECTION);
  return onSnapshot(collectionRef, (snapshot) => {
    const list: PemeliharaanRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as PemeliharaanRecord);
    });
    callback(list);
  }, (error) => {
    console.error('Error listening to Pemeliharaan:', error);
  });
}

// Save or Update a Pemeliharaan record in Cloud
export async function savePemeliharaanToCloud(record: PemeliharaanRecord): Promise<void> {
  const path = `${PEMELIHARAAN_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, PEMELIHARAAN_COLLECTION, record.id);
    const dataToSave = sanitizeData({
      ...record,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a Pemeliharaan record from Cloud
export async function deletePemeliharaanFromCloud(id: string): Promise<void> {
  const path = `${PEMELIHARAAN_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PEMELIHARAAN_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time listener for Activity Logs
export function subscribeActivityLogs(callback: (logs: ActivityLog[]) => void): () => void {
  const collectionRef = collection(db, ACTIVITY_LOGS_COLLECTION);
  return onSnapshot(collectionRef, (snapshot) => {
    const list: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
    });
    // Sort latest first
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(list);
  }, (error) => {
    console.error('Error listening to Activity Logs:', error);
  });
}

// Log an Activity
export async function logActivityToCloud(
  user: string,
  action: 'TAMBAH' | 'EDIT' | 'HAPUS',
  targetType: 'Gangguan' | 'Pemeliharaan' | 'ROW' | 'Inspeksi' | 'Penyulang' | 'Section' | 'Gangguan Pangkal',
  details: string,
  recordId?: string
): Promise<void> {
  const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const path = `${ACTIVITY_LOGS_COLLECTION}/${logId}`;
  try {
    const docRef = doc(db, ACTIVITY_LOGS_COLLECTION, logId);
    const dataToSave = sanitizeData<ActivityLog>({
      id: logId,
      timestamp: new Date().toISOString(),
      user: user || 'Sistem / Anonim',
      action,
      targetType,
      details,
      recordId: recordId || ''
    });
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error('Error logging activity to cloud:', error);
  }
}

export async function deleteActivityLogFromCloud(log: ActivityLog): Promise<void> {
  const logRef = doc(db, ACTIVITY_LOGS_COLLECTION, log.id);
  await deleteDoc(logRef);

  if (log.recordId) {
    try {
      if (log.targetType === 'Gangguan' || log.targetType === 'ROW' || log.targetType === 'Inspeksi') {
        await deleteRecordFromCloud(log.recordId);
      } else if (log.targetType === 'Pemeliharaan') {
        await deletePemeliharaanFromCloud(log.recordId);
      } else if (log.targetType === 'Penyulang') {
        await deletePenyulangFromCloud(log.recordId);
      } else if (log.targetType === 'Section') {
        await deleteMasterSectionFromCloud(log.recordId);
      } else if (log.targetType === 'Gangguan Pangkal') {
        await deleteGangguanPangkalFromCloud(log.recordId);
      }
    } catch (err) {
      console.warn("Failed to delete related data:", err);
    }
  }
}
