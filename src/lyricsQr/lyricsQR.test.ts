import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCollectionName, isFirebaseEnabled } from './lyricsQR.ts';

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

test('isFirebaseEnabled returns false only when USE_FIREBASE is explicitly "false"', () => {
  const original = process.env.USE_FIREBASE;

  try {
    process.env.USE_FIREBASE = 'false';
    assert.equal(isFirebaseEnabled(), false);

    process.env.USE_FIREBASE = 'true';
    assert.equal(isFirebaseEnabled(), true);

    delete process.env.USE_FIREBASE;
    assert.equal(isFirebaseEnabled(), true);
  } finally {
    if (original === undefined) {
      delete process.env.USE_FIREBASE;
    } else {
      process.env.USE_FIREBASE = original;
    }
  }
});
