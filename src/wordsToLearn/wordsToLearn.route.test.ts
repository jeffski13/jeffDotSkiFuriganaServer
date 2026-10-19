import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { mergeWords, type Word } from './wordsToLearnMerge.ts';

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

const state: { words: Word[]; failNext: boolean } = { words: [word()], failNext: false };

mock.module('./wordsToLearn.ts', {
  namedExports: {
    getWords: async () => {
      if (state.failNext) {
        state.failNext = false;
        throw new Error('boom');
      }
      return state.words;
    },
    mergeIncomingWords: async (incoming: Word[]) => {
      state.words = mergeWords(state.words, incoming);
      return state.words;
    },
  },
});

const UPDATE_KEY = 'correct-key';

mock.module('../lyricsQr/lyricsQR.ts', {
  namedExports: {
    getRedirectConfig: async () => ({ url: undefined, version: 0 }),
    isValidUpdateKey: async (key: string) => key === UPDATE_KEY,
    setRedirectUrl: async () => {},
  },
});

const { app } = await import('../app.ts');

const withServer = async (run: (baseUrl: string) => Promise<void>) => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await run(`http://localhost:${port}`);
  } finally {
    server.close();
  }
};

const post = (baseUrl: string, body: Record<string, unknown>, updateKey: unknown = UPDATE_KEY) =>
  fetch(`${baseUrl}/wordsToLearn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updateKey, ...body }),
  });

test('GET /wordsToLearn returns all words', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/wordsToLearn`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { words: [word()] });
  });
});

test('GET /wordsToLearn returns 500 when the store fails', async () => {
  state.failNext = true;
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/wordsToLearn`);

    assert.equal(response.status, 500);
  });
});

test('POST /wordsToLearn returns 400 when words is missing or invalid', async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await post(baseUrl, {})).status, 400);
    assert.equal((await post(baseUrl, { words: [{ id: 'x' }] })).status, 400);
  });
});

test('POST /wordsToLearn returns 400 when updateKey is not a string', async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await post(baseUrl, { words: [] }, null)).status, 400);
    assert.equal((await post(baseUrl, { words: [] }, 123)).status, 400);
  });
});

test('POST /wordsToLearn returns 403 and changes nothing when the updateKey is incorrect', async () => {
  await withServer(async (baseUrl) => {
    const before = state.words;
    const response = await post(baseUrl, { words: [word({ id: 'z', lastModified: 999 })] }, 'wrong-key');

    assert.equal(response.status, 403);
    assert.equal(state.words, before);
  });
});

test('POST /wordsToLearn merges additively and returns the full list', async () => {
  await withServer(async (baseUrl) => {
    const response = await post(baseUrl, {
      words: [word({ id: 'b', romaji: 'shouhin', english: 'stuff', lastModified: 200 })],
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.words.map((w: Word) => w.id).sort(), ['a', 'b']);
  });
});

test('POST /wordsToLearn applies a newer edit and keeps a delete tombstone', async () => {
  await withServer(async (baseUrl) => {
    const response = await post(baseUrl, { words: [word({ id: 'a', deleted: true, lastModified: 300 })] });

    const body = await response.json();
    assert.equal(body.words.find((w: Word) => w.id === 'a').deleted, true);
  });
});

test('OPTIONS /wordsToLearn responds to the CORS preflight', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/wordsToLearn`, { method: 'OPTIONS' });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
  });
});
