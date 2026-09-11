import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import lyricsQRDefaults from './lyricsQRDefaults.json' with { type: 'json' };

export const DEFAULT_REDIRECT_URL = lyricsQRDefaults.url;

const DEFAULT_FILE_PATH = path.resolve(process.cwd(), 'lyricsQR.local.json');

type LyricsQRLocalData = { url: string; updateKey: string };

const readData = (filePath: string): LyricsQRLocalData => {
  if (!existsSync(filePath)) {
    const defaults: LyricsQRLocalData = { url: DEFAULT_REDIRECT_URL, updateKey: randomUUID() };
    writeFileSync(filePath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

export const getLocalRedirectUrl = (filePath: string = DEFAULT_FILE_PATH): string => readData(filePath).url;

export const isValidLocalUpdateKey = (updateKey: string, filePath: string = DEFAULT_FILE_PATH): boolean =>
  readData(filePath).updateKey === updateKey;

export const setLocalRedirectUrl = (url: string, filePath: string = DEFAULT_FILE_PATH): void => {
  const data = readData(filePath);
  writeFileSync(filePath, JSON.stringify({ ...data, url }, null, 2));
};
