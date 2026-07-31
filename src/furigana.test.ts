import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAmbiguousKanjiOverrides } from './furigana.ts';

test('applyAmbiguousKanjiOverrides replaces the reading with the most common one', () => {
  const result = applyAmbiguousKanjiOverrides('道標（どうひょう）を見つけた');

  assert.equal(result, '道標（みちしるべ）を見つけた');
});

test('applyAmbiguousKanjiOverrides leaves an already-correct reading unchanged', () => {
  const result = applyAmbiguousKanjiOverrides('道標（みちしるべ）を見つけた');

  assert.equal(result, '道標（みちしるべ）を見つけた');
});

test('applyAmbiguousKanjiOverrides leaves text with no ambiguous kanji unchanged', () => {
  const result = applyAmbiguousKanjiOverrides('漢字（かんじ）を読む');

  assert.equal(result, '漢字（かんじ）を読む');
});
