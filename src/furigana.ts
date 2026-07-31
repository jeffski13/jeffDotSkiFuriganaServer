import { createRequire } from 'module';
import { ambiguousKanji, getDefaultReading } from './ambiguousKanji.ts';

const require = createRequire(import.meta.url);
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

const DELIMITER_START = '（';
const DELIMITER_END = '）';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replaces furigana readings for known ambiguous kanji with the most commonly
 * encountered reading, overriding whatever kuroshiro's dictionary picked.
 */
export const applyAmbiguousKanjiOverrides = (text: string): string => {
  return Object.keys(ambiguousKanji).reduce((result, kanji) => {
    const defaultReading = getDefaultReading(kanji);
    if (!defaultReading) {
      return result;
    }

    const pattern = new RegExp(`${escapeRegExp(kanji)}${DELIMITER_START}[^${DELIMITER_END}]+${DELIMITER_END}`, 'g');
    return result.replace(pattern, `${kanji}${DELIMITER_START}${defaultReading.reading}${DELIMITER_END}`);
  }, text);
};

interface KuroshiroInstance {
  convert(text: string, options: Record<string, unknown>): Promise<string>;
  init(analyzer: unknown): Promise<void>;
}

let initPromise: Promise<KuroshiroInstance> | null = null;

const getKuroshiro = (): Promise<KuroshiroInstance> => {
  if (!initPromise) {
    const instance: KuroshiroInstance = new Kuroshiro();
    initPromise = instance.init(new KuromojiAnalyzer()).then(() => instance);
  }
  return initPromise;
};

export const convertToFurigana = async (text: string): Promise<string> => {
  const kuroshiro = await getKuroshiro();
  const converted = await kuroshiro.convert(text, {
    mode: 'okurigana',
    to: 'hiragana',
    delimiter_start: DELIMITER_START,
    delimiter_end: DELIMITER_END,
  });
  return applyAmbiguousKanjiOverrides(converted);
};
