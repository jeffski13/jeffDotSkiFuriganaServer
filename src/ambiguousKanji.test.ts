import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultReading } from './ambiguousKanji.ts';

test('getDefaultReading returns the reading with the highest count', () => {
  const result = getDefaultReading('道標');

  assert.equal(result?.reading, 'みちしるべ');
});

test('getDefaultReading returns undefined for kanji with no ambiguous readings', () => {
  const result = getDefaultReading('未登録');

  assert.equal(result, undefined);
});
