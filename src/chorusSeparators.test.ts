import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORUS_SEPARATOR, insertChorusSeparators } from './chorusSeparators.ts';

test('insertChorusSeparators marks the top repeated line above and the bottom repeated line below', () => {
  const lines = [
    '空に願いをかける それは叶わぬ思い',
    '人はそうやっていくつも夜を越えて',
    '明日を探して来たんだろう',
    '君へ想いを馳せる 遠く離れていても',
    '一人こうして見上げる空の先に',
    'いつか 繋がり合える心を信じて',
    '流れ星キラリ 君は夢の中',
    '違う明日探す 今日の道標',
    '一瞬のヒカリ この想いよ届け',
    '君の為に出来る事見つけるのさ',
    '空の彼方まで',
    '時を越えて出会える まるで夢物語',
    '隠しきれない気持ちが風に舞う',
    'もしも あと少しの勇気があるなら',
    'めぐり逢うキセキ 光る一番星',
    '数えきれぬ星の中 見つけたんだ',
    '時はいつもまた 僕を追い越して行く',
    '走り出すよ 君にまだ間に合うかな',
    '旅に出かけよう',
    '悲しみで流した涙から',
    '温もり伝わる頬',
    '大空を見つめたこの場所から',
    'いつまでも 名を呼ぶよ',
    '流れ星キラリ 君は夢の中',
    '違う明日探す 今日の道標',
    '一瞬のヒカリ この想いよ届け',
    '君の為に出来る事見つけるのさ',
    '空の彼方まで',
    '旅に出かけよう',
  ];

  const result = insertChorusSeparators(lines);

  assert.deepEqual(result, [
    '空に願いをかける それは叶わぬ思い',
    '人はそうやっていくつも夜を越えて',
    '明日を探して来たんだろう',
    '君へ想いを馳せる 遠く離れていても',
    '一人こうして見上げる空の先に',
    'いつか 繋がり合える心を信じて',
    CHORUS_SEPARATOR,
    '流れ星キラリ 君は夢の中',
    '違う明日探す 今日の道標',
    '一瞬のヒカリ この想いよ届け',
    '君の為に出来る事見つけるのさ',
    '空の彼方まで',
    '時を越えて出会える まるで夢物語',
    '隠しきれない気持ちが風に舞う',
    'もしも あと少しの勇気があるなら',
    'めぐり逢うキセキ 光る一番星',
    '数えきれぬ星の中 見つけたんだ',
    '時はいつもまた 僕を追い越して行く',
    '走り出すよ 君にまだ間に合うかな',
    '旅に出かけよう',
    CHORUS_SEPARATOR,
    '悲しみで流した涙から',
    '温もり伝わる頬',
    '大空を見つめたこの場所から',
    'いつまでも 名を呼ぶよ',
    CHORUS_SEPARATOR,
    '流れ星キラリ 君は夢の中',
    '違う明日探す 今日の道標',
    '一瞬のヒカリ この想いよ届け',
    '君の為に出来る事見つけるのさ',
    '空の彼方まで',
    '旅に出かけよう',
    CHORUS_SEPARATOR,
  ]);
});

test('insertChorusSeparators returns the input unchanged when no line repeats', () => {
  const lines = ['一行目', '二行目', '三行目'];
  assert.deepEqual(insertChorusSeparators(lines), lines);
});

test('insertChorusSeparators wraps every occurrence when the same line wins both roles', () => {
  const lines = ['サビ', 'verse', 'サビ'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, [CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR, 'verse', CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR]);
});

test('insertChorusSeparators picks the top winner by earliest first occurrence and the bottom winner by latest last occurrence among ties', () => {
  const lines = ['A', 'B', 'A', 'B'];
  const result = insertChorusSeparators(lines);
  // A ties B on count; A occurs first (top winner, marked above), B occurs last (bottom winner, marked below).
  assert.deepEqual(result, [CHORUS_SEPARATOR, 'A', 'B', CHORUS_SEPARATOR, CHORUS_SEPARATOR, 'A', 'B', CHORUS_SEPARATOR]);
});

test('insertChorusSeparators ignores blank lines when counting repeats', () => {
  const lines = ['', '', '', 'サビ', '間奏', 'サビ'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, ['', '', '', CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR, '間奏', CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR]);
});
