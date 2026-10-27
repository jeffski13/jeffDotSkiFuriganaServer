import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAmbiguousKanjiOverrides, convertToFurigana, fixKanaTokenReadings } from './index.ts';

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

test('fixKanaTokenReadings replaces a kana reading that is shorter than the surface form', () => {
  const [token] = fixKanaTokenReadings([{ surface_form: 'カントリー・ロード', reading: 'カントリーロード' }]);

  assert.equal(token.reading, 'カントリー・ロード');
  assert.equal(token.pronunciation, 'カントリー・ロード');
});

test('fixKanaTokenReadings fills in a missing reading for an all-kana token', () => {
  const [token] = fixKanaTokenReadings([{ surface_form: 'ゝ' }]);

  assert.equal(token.reading, 'ゝ');
});

test('fixKanaTokenReadings leaves kana tokens with a matching reading unchanged', () => {
  const original = { surface_form: 'さよなら', reading: 'サヨナラ', pronunciation: 'サヨナラ' };

  assert.equal(fixKanaTokenReadings([original])[0], original);
});

test('fixKanaTokenReadings leaves tokens containing kanji unchanged', () => {
  const original = { surface_form: '故郷', reading: 'コキョウ' };

  assert.equal(fixKanaTokenReadings([original])[0], original);
});

test('convertToFurigana handles katakana compounds whose dictionary reading drops the middle dot', async () => {
  assert.equal(await convertToFurigana('カントリー・ロード'), 'カントリー・ロード');
  assert.equal(await convertToFurigana('さよならカントリー・ロード'), 'さよならカントリー・ロード');
  assert.equal(
    await convertToFurigana('カントリー・ロード（カントリー・ロード）'),
    'カントリー・ロード（カントリー・ロード）',
  );
});

test('convertToFurigana still adds furigana to kanji next to dotted katakana', async () => {
  assert.equal(await convertToFurigana('この道はカントリー・ロード'), 'この道（みち）はカントリー・ロード');
});
