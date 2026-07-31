import { createRequire } from 'module';
import { ambiguousKanji, getDefaultReading } from './ambiguousKanji.ts';

const require = createRequire(import.meta.url);
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

const DELIMITER_START = '（';
const DELIMITER_END = '）';

/**
 * For every ambiguous kanji present in the original input, checks whether any of
 * its known reading variants appear in kuroshiro's output, and if so replaces that
 * variant with the most commonly encountered one, overriding kuroshiro's pick.
 */
export const applyAmbiguousKanjiOverrides = (originalText: string, convertedText: string): string => {
  return Object.entries(ambiguousKanji).reduce((result, [kanji, readings]) => {
    if (!originalText.includes(kanji)) {
      return result;
    }

    const defaultReading = getDefaultReading(kanji);
    if (!defaultReading) {
      return result;
    }

    return readings.reduce((text, candidate) => {
      if (candidate.readingOutput === defaultReading.readingOutput) {
        return text;
      }
      return text.split(candidate.readingOutput).join(defaultReading.readingOutput);
    }, result);
  }, convertedText);
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
  return applyAmbiguousKanjiOverrides(text, converted);
};
