import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCollectionName } from './lyricsQR.ts';

test('getCollectionName returns the dev-prefixed collection when NODE_ENV is not production', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  try {
    assert.equal(getCollectionName(), 'dev-lyricsQR');
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('getCollectionName returns the production collection name when NODE_ENV is production', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    assert.equal(getCollectionName(), 'lyricsQR');
  } finally {
    process.env.NODE_ENV = original;
  }
});
