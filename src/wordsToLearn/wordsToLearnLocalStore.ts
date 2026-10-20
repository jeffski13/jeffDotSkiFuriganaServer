import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import wordsToLearnDefaults from './wordsToLearnDefaults.json' with { type: 'json' };
import { mergeWords, type Word } from './wordsToLearnMerge.ts';

export const DEFAULT_WORDS = wordsToLearnDefaults.words as Word[];

const DEFAULT_FILE_PATH = path.resolve(process.cwd(), 'wordsToLearn.local.json');

// updateKey is not seeded: it must be added to the local file by hand.
type WordsToLearnLocalData = { updateKey?: string; words: Word[] };

const readData = (filePath: string): WordsToLearnLocalData => {
  if (!existsSync(filePath)) {
    const defaults: WordsToLearnLocalData = { words: DEFAULT_WORDS };
    writeFileSync(filePath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

export const getLocalWords = (filePath: string = DEFAULT_FILE_PATH): Word[] => readData(filePath).words;

export const isValidLocalUpdateKey = (updateKey: string, filePath: string = DEFAULT_FILE_PATH): boolean => {
  const expectedUpdateKey = readData(filePath).updateKey;
  return typeof expectedUpdateKey === 'string' && expectedUpdateKey === updateKey;
};

export const mergeLocalWords = (incoming: Word[], filePath: string = DEFAULT_FILE_PATH): Word[] => {
  const data = readData(filePath);
  const words = mergeWords(data.words, incoming);
  writeFileSync(filePath, JSON.stringify({ ...data, words }, null, 2));
  return words;
};
