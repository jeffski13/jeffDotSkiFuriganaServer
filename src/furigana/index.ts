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

export interface AnalyzerToken {
  surface_form: string;
  reading?: string;
  pronunciation?: string;
  [key: string]: unknown;
}

interface Analyzer {
  init(): Promise<void>;
  parse(text: string): Promise<AnalyzerToken[]>;
}

// Kuroshiro treats any character in U+3040–U+30FF as kana, including symbols like '・', 'ー',
// 'ヽ' and 'ゝ'. Same range as kuroshiro's own isHiragana/isKatakana.
const isKanaRange = (ch: string): boolean => ch >= '぀' && ch <= 'ヿ';

/**
 * Kuroshiro reads all-kana tokens character by character, pairing surface_form[i] with
 * reading[i], so it throws "str is not iterable" when the reading is shorter than the
 * surface. kuromoji produces such readings for some dictionary entries, e.g. カントリー・ロード
 * is read as カントリーロード (the '・' is dropped). Kana needs no furigana anyway, so for those
 * tokens use the surface form itself as the reading.
 */
export const fixKanaTokenReadings = (tokens: AnalyzerToken[]): AnalyzerToken[] =>
  tokens.map((token) => {
    const surface = token.surface_form;
    const isAllKana = surface.length > 0 && [...surface].every(isKanaRange);
    if (!isAllKana || token.reading?.length === surface.length) {
      return token;
    }
    return { ...token, reading: surface, pronunciation: surface };
  });

const withFixedKanaReadings = (analyzer: Analyzer): Analyzer => ({
  init: () => analyzer.init(),
  parse: async (text) => fixKanaTokenReadings(await analyzer.parse(text)),
});

let initPromise: Promise<KuroshiroInstance> | null = null;

const getKuroshiro = (): Promise<KuroshiroInstance> => {
  if (!initPromise) {
    const instance: KuroshiroInstance = new Kuroshiro();
    initPromise = instance.init(withFixedKanaReadings(new KuromojiAnalyzer())).then(() => instance);
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
