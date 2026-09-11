import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_REDIRECT_URL,
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

test('isValidLocalUpdateKey generates a random updateKey and validates against it', async () => {
  await withTempFile((filePath) => {
    assert.equal(isValidLocalUpdateKey('not-the-key', filePath), false);
    assert.equal(isValidLocalUpdateKey('also-not-the-key', filePath), false);
  });
});

test('setLocalRedirectUrl persists the new url without changing the updateKey', async () => {
  await withTempFile((filePath) => {
    // Seed the file and capture the generated updateKey.
    getLocalRedirectUrl(filePath);
    const updateKey = JSON.parse(readFileSync(filePath, 'utf-8')).updateKey;

    setLocalRedirectUrl('https://example.com/new', filePath);

    assert.equal(getLocalRedirectUrl(filePath), 'https://example.com/new');
    assert.equal(isValidLocalUpdateKey(updateKey, filePath), true);
  });
});
