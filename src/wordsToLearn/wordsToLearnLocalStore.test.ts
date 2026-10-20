import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_WORDS, getLocalWords, isValidLocalUpdateKey, mergeLocalWords } from './wordsToLearnLocalStore.ts';
import { isWord } from './wordsToLearnMerge.ts';

const withTempFile = async (run: (filePath: string) => Promise<void> | void) => {
  const filePath = path.join(os.tmpdir(), `wordsToLearn.local.test.${Date.now()}.${Math.random()}.json`);
  try {
    await run(filePath);
  } finally {
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  }
};

test('the default words are all valid and have unique ids', () => {
  assert.equal(DEFAULT_WORDS.every(isWord), true);
  assert.equal(new Set(DEFAULT_WORDS.map((w) => w.id)).size, DEFAULT_WORDS.length);
  assert.ok(DEFAULT_WORDS.some((w) => w.list === 'learning'));
  assert.ok(DEFAULT_WORDS.some((w) => w.list === 'wantToLearn'));
});

test('getLocalWords creates the file with the default words when it does not exist', async () => {
  await withTempFile((filePath) => {
    assert.equal(existsSync(filePath), false);

    assert.deepEqual(getLocalWords(filePath), DEFAULT_WORDS);
    assert.equal(existsSync(filePath), true);
  });
});

test('mergeLocalWords persists new words and newer edits, and returns the full list', async () => {
  await withTempFile((filePath) => {
    const [first] = DEFAULT_WORDS;
    const added = { ...first, id: 'new-word', romaji: 'atarashii', english: 'new', lastModified: 500 };
    const edited = { ...first, english: 'edited', lastModified: 500 };

    const result = mergeLocalWords([added, edited], filePath);

    assert.equal(result.length, DEFAULT_WORDS.length + 1);
    const persisted = getLocalWords(filePath);
    assert.equal(persisted.find((w) => w.id === 'new-word')?.english, 'new');
    assert.equal(persisted.find((w) => w.id === first.id)?.english, 'edited');
  });
});

test('mergeLocalWords ignores an edit older than the stored copy', async () => {
  await withTempFile((filePath) => {
    const [first] = DEFAULT_WORDS;
    mergeLocalWords([{ ...first, english: 'newer', lastModified: 500 }], filePath);
    mergeLocalWords([{ ...first, english: 'older', lastModified: 400 }], filePath);

    assert.equal(getLocalWords(filePath).find((w) => w.id === first.id)?.english, 'newer');
  });
});

test('isValidLocalUpdateKey rejects every key when the file has no updateKey', async () => {
  await withTempFile((filePath) => {
    assert.equal(isValidLocalUpdateKey('anything', filePath), false);
    assert.equal(isValidLocalUpdateKey('', filePath), false);
  });
});

test('isValidLocalUpdateKey validates against the updateKey stored in the file', async () => {
  await withTempFile((filePath) => {
    writeFileSync(filePath, JSON.stringify({ updateKey: 'local-key', words: DEFAULT_WORDS }));

    assert.equal(isValidLocalUpdateKey('local-key', filePath), true);
    assert.equal(isValidLocalUpdateKey('wrong-key', filePath), false);
  });
});

test('mergeLocalWords keeps the updateKey when it rewrites the file', async () => {
  await withTempFile((filePath) => {
    writeFileSync(filePath, JSON.stringify({ updateKey: 'local-key', words: DEFAULT_WORDS }));
    const [first] = DEFAULT_WORDS;

    mergeLocalWords([{ ...first, english: 'edited', lastModified: 500 }], filePath);

    assert.equal(JSON.parse(readFileSync(filePath, 'utf-8')).updateKey, 'local-key');
    assert.equal(isValidLocalUpdateKey('local-key', filePath), true);
  });
});
