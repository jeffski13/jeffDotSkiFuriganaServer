import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { isNonProductionEnvironment } from '../chorusSeparators.ts';
import { getLocalRedirectUrl, isValidLocalUpdateKey, setLocalRedirectUrl } from './lyricsQRLocalStore.ts';
import { loadEnvironmentConfig } from './loadEnv.ts';

loadEnvironmentConfig();

const DOCUMENT_ID = 'config';
const DATABASE_ID = 'lyricsqr';

export const getCollectionName = (): string => (isNonProductionEnvironment() ? 'dev-lyricsQR' : 'lyricsQR');

export const isFirebaseEnabled = (): boolean => process.env.USE_FIREBASE !== 'false';

const getDb = () => {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore(DATABASE_ID);
};

const getConfigDoc = () => getDb().collection(getCollectionName()).doc(DOCUMENT_ID);

export const getRedirectUrl = async (): Promise<string | undefined> => {
  if (!isFirebaseEnabled()) {
    return getLocalRedirectUrl();
  }

  const snapshot = await getConfigDoc().get();
  return snapshot.data()?.url;
};

export const isValidUpdateKey = async (updateKey: string): Promise<boolean> => {
  if (!isFirebaseEnabled()) {
    return isValidLocalUpdateKey(updateKey);
  }

  const snapshot = await getConfigDoc().get();
  const expectedUpdateKey = snapshot.data()?.updateKey;
  return typeof expectedUpdateKey === 'string' && expectedUpdateKey === updateKey;
};

export const setRedirectUrl = async (url: string): Promise<void> => {
  if (!isFirebaseEnabled()) {
    setLocalRedirectUrl(url);
    return;
  }

  await getConfigDoc().set({ url }, { merge: true });
};
