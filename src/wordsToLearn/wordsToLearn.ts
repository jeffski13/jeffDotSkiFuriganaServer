import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { isNonProductionEnvironment } from '../chorusSeparator/index.ts';
import { loadEnvironmentConfig } from '../lyricsQr/loadEnv.ts';
import { getLocalWords, mergeLocalWords } from './wordsToLearnLocalStore.ts';
import { isWord, mergeWords, shouldReplace, toWord, type Word } from './wordsToLearnMerge.ts';

loadEnvironmentConfig();

const DATABASE_ID = 'lyricsqr';

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

// Writes each incoming word unless the stored copy is newer, then returns the full list.
export const mergeIncomingWords = async (incoming: Word[]): Promise<Word[]> => {
  if (!isFirebaseEnabled()) {
    return mergeLocalWords(incoming);
  }

  // collapse duplicate ids so each document is read and written once
  const uniqueIncoming = mergeWords([], incoming);
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
