import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { isNonProductionEnvironment } from './chorusSeparators.ts';

const COLLECTION = isNonProductionEnvironment() ? 'dev-lyricsQR' : 'lyricsQR';
const DOCUMENT_ID = 'config';

const getDb = () => {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore();
};

const getConfigDoc = () => getDb().collection(COLLECTION).doc(DOCUMENT_ID);

export const getRedirectUrl = async (): Promise<string | undefined> => {
  const snapshot = await getConfigDoc().get();
  return snapshot.data()?.url;
};

export const isValidUpdateKey = async (updateKey: string): Promise<boolean> => {
  const snapshot = await getConfigDoc().get();
  const expectedUpdateKey = snapshot.data()?.updateKey;
  return typeof expectedUpdateKey === 'string' && expectedUpdateKey === updateKey;
};

export const setRedirectUrl = async (url: string): Promise<void> => {
  await getConfigDoc().set({ url }, { merge: true });
};
