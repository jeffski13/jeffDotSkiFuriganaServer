export const WORD_LISTS = ['learning', 'wantToLearn'] as const;
export type WordList = (typeof WORD_LISTS)[number];

// Deletions are kept as tombstones (deleted: true) so that a delete made on one
// device wins over an older copy of the same word still sitting on another device.
export type Word = {
  id: string;
  romaji: string;
  english: string;
  list: WordList;
  order: number;
  lastModified: number;
  deleted: boolean;
};

export const isWord = (value: unknown): value is Word => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const word = value as Record<string, unknown>;
  return (
    typeof word.id === 'string' &&
    word.id.length > 0 &&
    typeof word.romaji === 'string' &&
    typeof word.english === 'string' &&
    typeof word.list === 'string' &&
    (WORD_LISTS as readonly string[]).includes(word.list) &&
    typeof word.order === 'number' &&
    Number.isFinite(word.order) &&
    typeof word.lastModified === 'number' &&
    Number.isFinite(word.lastModified) &&
    typeof word.deleted === 'boolean'
  );
};

export const toWord = (word: Word): Word => ({
  id: word.id,
  romaji: word.romaji,
  english: word.english,
  list: word.list,
  order: word.order,
  lastModified: word.lastModified,
  deleted: word.deleted,
});

// Should `incoming` replace `existing`? Newer lastModified wins; on a tie a deletion
// wins so a delete is never silently undone.
export const shouldReplace = (existing: Word | undefined, incoming: Word): boolean => {
  if (!existing) {
    return true;
  }
  if (incoming.lastModified !== existing.lastModified) {
    return incoming.lastModified > existing.lastModified;
  }
  return incoming.deleted && !existing.deleted;
};

// Additive merge: every id from either side is kept, and for ids on both sides the
// newer copy wins. Words added independently on two devices have different ids, so
// both survive.
export const mergeWords = (existing: Word[], incoming: Word[]): Word[] => {
  const byId = new Map(existing.map((word) => [word.id, word]));
  for (const word of incoming) {
    if (shouldReplace(byId.get(word.id), word)) {
      byId.set(word.id, toWord(word));
    }
  }
  return [...byId.values()];
};
