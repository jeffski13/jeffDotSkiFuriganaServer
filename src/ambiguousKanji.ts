export interface AmbiguousReading {
  reading: string;
  note: string;
}

export const ambiguousKanji: Record<string, AmbiguousReading[]> = {
  道標: [
    { reading: 'どうひょう', note: 'on-yomi compound reading; dictionary default, common in technical/formal contexts' },
    { reading: 'みちしるべ', note: 'kun-yomi reading; common in poetic and lyrical contexts (e.g. song lyrics)' },
  ],
};
