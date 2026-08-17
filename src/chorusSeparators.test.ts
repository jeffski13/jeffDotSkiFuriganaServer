import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORUS_SEPARATOR, insertChorusSeparators } from './chorusSeparators.ts';

test('insertChorusSeparators inserts a separator above every occurrence of the most frequent line', () => {
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
    '空の彼方まで 旅に出かけよう',
  ];

  const result = insertChorusSeparators(lines);

  const separatorIndexes = result.reduce<number[]>((acc, line, index) => {
    if (line === CHORUS_SEPARATOR) acc.push(index);
    return acc;
  }, []);

  assert.equal(separatorIndexes.length, 2);
  assert.equal(result[separatorIndexes[0] + 1], '流れ星キラリ 君は夢の中');
  assert.equal(result[separatorIndexes[1] + 1], '流れ星キラリ 君は夢の中');
  assert.equal(result.length, lines.length + 2);
});

test('insertChorusSeparators returns the input unchanged when no line repeats', () => {
  const lines = ['一行目', '二行目', '三行目'];
  assert.deepEqual(insertChorusSeparators(lines), lines);
});

test('insertChorusSeparators ignores blank lines when counting repeats', () => {
  const lines = ['', '', '', 'サビ', '間奏', 'サビ'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, ['', '', '', CHORUS_SEPARATOR, 'サビ', '間奏', CHORUS_SEPARATOR, 'サビ']);
});
