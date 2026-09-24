import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_REDIRECT_URL,
  DEFAULT_UPDATE_KEY,
  DEFAULT_VERSION,
  getLocalRedirectConfig,
  getLocalRedirectUrl,
  isValidLocalUpdateKey,
  setLocalRedirectUrl,
} from './lyricsQRLocalStore.ts';

const withTempFile = async (run: (filePath: string) => Promise<void> | void) => {
  const filePath = path.join(os.tmpdir(), `lyricsQR.local.test.${Date.now()}.${Math.random()}.json`);
  try {
    await run(filePath);
  } finally {
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  }
};

test('getLocalRedirectUrl creates the file with default values when it does not exist', async () => {
  await withTempFile(async (filePath) => {
    assert.equal(existsSync(filePath), false);

    const url = getLocalRedirectUrl(filePath);

    assert.equal(url, DEFAULT_REDIRECT_URL);
    assert.equal(existsSync(filePath), true);
  });
});

test('isValidLocalUpdateKey seeds the file with the default updateKey and validates against it', async () => {
  await withTempFile((filePath) => {
    assert.equal(isValidLocalUpdateKey('not-the-key', filePath), false);
    assert.equal(isValidLocalUpdateKey(DEFAULT_UPDATE_KEY, filePath), true);
  });
});

test('setLocalRedirectUrl persists the new url without changing the updateKey', async () => {
  await withTempFile((filePath) => {
    getLocalRedirectUrl(filePath);

    setLocalRedirectUrl('https://example.com/new', filePath);

    assert.equal(getLocalRedirectUrl(filePath), 'https://example.com/new');
    assert.equal(isValidLocalUpdateKey(DEFAULT_UPDATE_KEY, filePath), true);
  });
});

test('getLocalRedirectConfig seeds the file with the default version', async () => {
  await withTempFile((filePath) => {
    assert.deepEqual(getLocalRedirectConfig(filePath), { url: DEFAULT_REDIRECT_URL, version: DEFAULT_VERSION });
  });
});

test('setLocalRedirectUrl increments the version on each update', async () => {
  await withTempFile((filePath) => {
    setLocalRedirectUrl('https://example.com/first', filePath);
    assert.equal(getLocalRedirectConfig(filePath).version, DEFAULT_VERSION + 1);

    setLocalRedirectUrl('https://example.com/second', filePath);
    assert.deepEqual(getLocalRedirectConfig(filePath), {
      url: 'https://example.com/second',
      version: DEFAULT_VERSION + 2,
    });
  });
});
