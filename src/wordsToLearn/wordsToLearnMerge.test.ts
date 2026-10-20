import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isWord, mergeWords, shouldReplace, type Word } from './wordsToLearnMerge.ts';

const word = (overrides: Partial<Word> = {}): Word => ({
  id: 'a',
  romaji: 'katsudou',
  english: 'activity',
  list: 'learning',
  order: 0,
  lastModified: 100,
  deleted: false,
  ...overrides,
});

test('isWord accepts a valid word', () => {
  assert.equal(isWord(word()), true);
});

test('isWord accepts every word list', () => {
  for (const list of ['learning', 'wantToLearn', 'culture']) {
    assert.equal(isWord({ ...word(), list }), true);
  }
});

test('isWord rejects missing fields, unknown lists, and non-finite numbers', () => {
  assert.equal(isWord(null), false);
  assert.equal(isWord({ ...word(), id: '' }), false);
  assert.equal(isWord({ ...word(), list: 'done' }), false);
  assert.equal(isWord({ ...word(), order: Number.NaN }), false);
  assert.equal(isWord({ ...word(), lastModified: '100' }), false);
  const { deleted: _deleted, ...withoutDeleted } = word();
  assert.equal(isWord(withoutDeleted), false);
});

test('shouldReplace prefers the newer lastModified', () => {
  assert.equal(shouldReplace(undefined, word()), true);
  assert.equal(shouldReplace(word({ lastModified: 100 }), word({ lastModified: 200 })), true);
  assert.equal(shouldReplace(word({ lastModified: 200 }), word({ lastModified: 100 })), false);
});

test('shouldReplace lets a deletion win a lastModified tie', () => {
  assert.equal(shouldReplace(word(), word({ deleted: true })), true);
  assert.equal(shouldReplace(word({ deleted: true }), word()), false);
  assert.equal(shouldReplace(word(), word()), false);
});

test('mergeWords keeps words added independently on both sides (additive)', () => {
  const merged = mergeWords([word({ id: 'device1' })], [word({ id: 'device2', romaji: 'katsudou' })]);
  assert.deepEqual(merged.map((w) => w.id).sort(), ['device1', 'device2']);
});

test('mergeWords keeps the newer copy of a word present on both sides', () => {
  const merged = mergeWords(
    [word({ id: 'a', list: 'learning', lastModified: 100 }), word({ id: 'b', english: 'old', lastModified: 300 })],
    [word({ id: 'a', list: 'wantToLearn', lastModified: 200 }), word({ id: 'b', english: 'stale', lastModified: 50 })],
  );
  assert.equal(merged.find((w) => w.id === 'a')?.list, 'wantToLearn');
  assert.equal(merged.find((w) => w.id === 'b')?.english, 'old');
});

test('mergeWords strips unknown fields from incoming words', () => {
  const merged = mergeWords([], [{ ...word(), extra: 'nope' } as Word]);
  assert.deepEqual(Object.keys(merged[0]).sort(), ['deleted', 'english', 'id', 'lastModified', 'list', 'order', 'romaji']);
});
