import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

const state = {
  url: 'https://example.com/original',
  updateKey: 'correct-key',
  version: 3,
};

mock.module('./lyricsQR.ts', {
  namedExports: {
    getRedirectConfig: async () => ({ url: state.url, version: state.version }),
    isValidUpdateKey: async (key: string) => key === state.updateKey,
    setRedirectUrl: async (url: string) => {
      state.url = url;
      state.version += 1;
    },
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

test('GET /lyricsQR returns the current redirect url and version', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/lyricsQR`);

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.url, 'https://example.com/original');
    assert.equal(body.version, 3);
  });
});

test('POST /lyricsQR returns 400 when updateKey or url is missing', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/lyricsQR`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateKey: 'correct-key' }),
    });

    assert.equal(response.status, 400);
  });
});

test('POST /lyricsQR returns 403 when the updateKey is incorrect', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/lyricsQR`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateKey: 'wrong-key', url: 'https://example.com/new' }),
    });

    assert.equal(response.status, 403);

    const getResponse = await fetch(`${baseUrl}/lyricsQR`);
    const body = await getResponse.json();
    assert.equal(body.version, 3);
  });
});

test('POST /lyricsQR updates the redirect url and increments the version when the updateKey is correct', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/lyricsQR`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateKey: 'correct-key', url: 'https://example.com/new' }),
    });

    assert.equal(response.status, 204);

    const getResponse = await fetch(`${baseUrl}/lyricsQR`);
    const body = await getResponse.json();
    assert.equal(body.url, 'https://example.com/new');
    assert.equal(body.version, 4);
  });
});
