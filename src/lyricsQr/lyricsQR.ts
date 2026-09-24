import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { isNonProductionEnvironment } from '../chorusSeparator/index.ts';
import { getLocalRedirectConfig, isValidLocalUpdateKey, setLocalRedirectUrl } from './lyricsQRLocalStore.ts';
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

export type RedirectConfig = { url: string | undefined; version: number };

export const getRedirectConfig = async (): Promise<RedirectConfig> => {
  if (!isFirebaseEnabled()) {
    return getLocalRedirectConfig();
  }

  const snapshot = await getConfigDoc().get();
  const data = snapshot.data();
  return { url: data?.url, version: typeof data?.version === 'number' ? data.version : 0 };
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

  await getConfigDoc().set({ url, version: FieldValue.increment(1) }, { merge: true });
};
