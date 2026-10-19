import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { isNonProductionEnvironment } from '../chorusSeparator/index.ts';
import { loadEnvironmentConfig } from '../lyricsQr/loadEnv.ts';
import { getLocalWords, isValidLocalUpdateKey, mergeLocalWords } from './wordsToLearnLocalStore.ts';
import { isWord, mergeWords, shouldReplace, toWord, type Word } from './wordsToLearnMerge.ts';

loadEnvironmentConfig();

const DATABASE_ID = 'lyricsqr';

// Holds { updateKey } alongside the word documents. It never passes isWord, so getWords skips it.
export const CONFIG_DOCUMENT_ID = 'config';

export const getCollectionName = (): string => (isNonProductionEnvironment() ? 'dev-wordsToLearn' : 'wordsToLearn');

export const isFirebaseEnabled = (): boolean => process.env.USE_FIREBASE !== 'false';

const getDb = () => {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore(DATABASE_ID);
};

const getCollection = () => getDb().collection(getCollectionName());

// One document per word, keyed by the word id.
export const getWords = async (): Promise<Word[]> => {
  if (!isFirebaseEnabled()) {
    return getLocalWords();
  }

  const snapshot = await getCollection().get();
  return snapshot.docs.map((doc) => doc.data()).filter(isWord).map(toWord);
};

export const isValidUpdateKey = async (updateKey: string): Promise<boolean> => {
  if (!isFirebaseEnabled()) {
    return isValidLocalUpdateKey(updateKey);
  }

  const snapshot = await getCollection().doc(CONFIG_DOCUMENT_ID).get();
  const expectedUpdateKey = snapshot.data()?.updateKey;
  return typeof expectedUpdateKey === 'string' && expectedUpdateKey === updateKey;
};

// Writes each incoming word unless the stored copy is newer, then returns the full list.
export const mergeIncomingWords = async (incoming: Word[]): Promise<Word[]> => {
  if (!isFirebaseEnabled()) {
    return mergeLocalWords(incoming);
  }

  // collapse duplicate ids so each document is read and written once, and never let a
  // word overwrite the config document
  const uniqueIncoming = mergeWords([], incoming).filter((word) => word.id !== CONFIG_DOCUMENT_ID);
  if (uniqueIncoming.length > 0) {
    const db = getDb();
    const collection = getCollection();
    await db.runTransaction(async (transaction) => {
      const refs = uniqueIncoming.map((word) => collection.doc(word.id));
      const snapshots = await transaction.getAll(...refs);
      snapshots.forEach((snapshot, index) => {
        const stored = snapshot.data();
        const existing = isWord(stored) ? stored : undefined;
        if (shouldReplace(existing, uniqueIncoming[index])) {
          transaction.set(refs[index], uniqueIncoming[index]);
        }
      });
    });
  }

  return getWords();
};
