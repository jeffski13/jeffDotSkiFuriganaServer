export interface AmbiguousReading {
  readingOutput: string;
  /** Manually updated count of times this reading has been encountered; used to pick the default reading. */
  count: number;
  note?: string;
}

export const ambiguousKanji: Record<string, AmbiguousReading[]> = {
  道標: [
    { readingOutput: '道標（どうひょう）', count: 0, note: 'on-yomi compound reading; dictionary default, common in technical/formal contexts', },
    { readingOutput: '道標（みちしるべ）', count: 1, note: 'kun-yomi reading; common in poetic and lyrical contexts (e.g. song lyrics)', },
  ],
  一人: [
    { readingOutput: '一（いち）人（にん）', count: 0 },
    { readingOutput: '一人（ひとり）', count: 1 },
  ],
  日本: [
    { readingOutput: '日本（にほん）', count: 1 },
    { readingOutput: '日本（にっぽん）', count: 0 },
  ],
  音: [
    { readingOutput: '音（おと）', count: 1 },
    { readingOutput: '音（おん）', count: 0 },
  ],
};

/**
 * Returns the reading with the highest count for a given kanji, i.e. the reading
 * to default to when generating furigana. Ties fall back to the first entry.
 */
export function getDefaultReading(kanji: string): AmbiguousReading | undefined {
  const readings = ambiguousKanji[kanji];
  if (!readings || readings.length === 0) {
    return undefined;
  }
  return readings.reduce((mostCommon, candidate) => (candidate.count > mostCommon.count ? candidate : mostCommon));
}
