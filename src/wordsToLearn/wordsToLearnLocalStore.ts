import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import wordsToLearnDefaults from './wordsToLearnDefaults.json' with { type: 'json' };
import { mergeWords, type Word } from './wordsToLearnMerge.ts';

export const DEFAULT_WORDS = wordsToLearnDefaults.words as Word[];

const DEFAULT_FILE_PATH = path.resolve(process.cwd(), 'wordsToLearn.local.json');

type WordsToLearnLocalData = { words: Word[] };

const readData = (filePath: string): WordsToLearnLocalData => {
  if (!existsSync(filePath)) {
    const defaults: WordsToLearnLocalData = { words: DEFAULT_WORDS };
    writeFileSync(filePath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

export const getLocalWords = (filePath: string = DEFAULT_FILE_PATH): Word[] => readData(filePath).words;

export const mergeLocalWords = (incoming: Word[], filePath: string = DEFAULT_FILE_PATH): Word[] => {
  const words = mergeWords(readData(filePath).words, incoming);
  writeFileSync(filePath, JSON.stringify({ words }, null, 2));
  return words;
};
