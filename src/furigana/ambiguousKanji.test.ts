import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultReading } from './ambiguousKanji.ts';

test('getDefaultReading returns the reading with the highest count', () => {
  const result = getDefaultReading('道標');

  assert.equal(result?.readingOutput, '道標（みちしるべ）');
});

test('getDefaultReading returns the reading with the highest count for a multi-kanji entry', () => {
  const result = getDefaultReading('一人');

  assert.equal(result?.readingOutput, '一人（ひとり）');
});

test('getDefaultReading returns undefined for kanji with no ambiguous readings', () => {
  const result = getDefaultReading('未登録');

  assert.equal(result, undefined);
});
