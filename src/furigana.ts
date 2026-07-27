import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

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
  return kuroshiro.convert(text, {
    mode: 'okurigana',
    to: 'hiragana',
    delimiter_start: '(',
    delimiter_end: ')',
  });
};
