import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCollectionName, isFirebaseEnabled, toIsoString } from './lyricsQR.ts';

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

test('toIsoString converts a Firestore Timestamp-like value to an ISO string', () => {
  const timestamp = { toDate: () => new Date('2026-11-23T14:05:00.000Z') };
  assert.equal(toIsoString(timestamp), '2026-11-23T14:05:00.000Z');
});

test('toIsoString returns null when the value is missing or not a Timestamp', () => {
  assert.equal(toIsoString(undefined), null);
  assert.equal(toIsoString(null), null);
  assert.equal(toIsoString('2026-11-23T14:05:00.000Z'), null);
});
