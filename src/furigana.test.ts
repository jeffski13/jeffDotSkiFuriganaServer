import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAmbiguousKanjiOverrides } from './furigana.ts';

test('applyAmbiguousKanjiOverrides replaces the reading with the most common one', () => {
  const result = applyAmbiguousKanjiOverrides('道標を見つけた', '道標（どうひょう）を見つけた');

  assert.equal(result, '道標（みちしるべ）を見つけた');
});

test('applyAmbiguousKanjiOverrides leaves an already-correct reading unchanged', () => {
  const result = applyAmbiguousKanjiOverrides('道標を見つけた', '道標（みちしるべ）を見つけた');

  assert.equal(result, '道標（みちしるべ）を見つけた');
});

test('applyAmbiguousKanjiOverrides leaves text with no ambiguous kanji unchanged', () => {
  const result = applyAmbiguousKanjiOverrides('漢字を読む', '漢字（かんじ）を読む');

  assert.equal(result, '漢字（かんじ）を読む');
});

test('applyAmbiguousKanjiOverrides replaces a per-character breakdown with the combined reading', () => {
  const result = applyAmbiguousKanjiOverrides('一人で行った', '一（いち）人（にん）で行った');

  assert.equal(result, '一人（ひとり）で行った');
});

test('applyAmbiguousKanjiOverrides does not touch an unrelated kanji whose reading string coincidentally matches', () => {
  const result = applyAmbiguousKanjiOverrides('漢字（かんじ）を読む', '漢字（かんじ）を読む');

  assert.equal(result, '漢字（かんじ）を読む');
});
