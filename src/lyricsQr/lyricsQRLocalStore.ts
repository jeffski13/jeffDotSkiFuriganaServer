import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import lyricsQRDefaults from './lyricsQRDefaults.json' with { type: 'json' };

export const DEFAULT_REDIRECT_URL = lyricsQRDefaults.url;
export const DEFAULT_UPDATE_KEY = lyricsQRDefaults.updateKey;
export const DEFAULT_VERSION = lyricsQRDefaults.version;

const DEFAULT_FILE_PATH = path.resolve(process.cwd(), 'lyricsQR.local.json');

type LyricsQRLocalData = { url: string; updateKey: string; version?: number };

const readData = (filePath: string): LyricsQRLocalData => {
  if (!existsSync(filePath)) {
    const defaults: LyricsQRLocalData = { url: DEFAULT_REDIRECT_URL, updateKey: DEFAULT_UPDATE_KEY, version: DEFAULT_VERSION };
    writeFileSync(filePath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

export const getLocalRedirectUrl = (filePath: string = DEFAULT_FILE_PATH): string => readData(filePath).url;

export const getLocalRedirectConfig = (filePath: string = DEFAULT_FILE_PATH): { url: string; version: number } => {
  const data = readData(filePath);
  return { url: data.url, version: data.version ?? DEFAULT_VERSION };
};

export const isValidLocalUpdateKey = (updateKey: string, filePath: string = DEFAULT_FILE_PATH): boolean =>
  readData(filePath).updateKey === updateKey;

export const setLocalRedirectUrl = (url: string, filePath: string = DEFAULT_FILE_PATH): void => {
  const data = readData(filePath);
  writeFileSync(filePath, JSON.stringify({ ...data, url, version: (data.version ?? DEFAULT_VERSION) + 1 }, null, 2));
};
