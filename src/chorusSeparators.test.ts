import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORUS_SEPARATOR, insertChorusSeparators } from './chorusSeparators.ts';

test('insertChorusSeparators also splits an oversized instance of the repeated block at smallestNumOfLines', () => {
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
    CHORUS_SEPARATOR,
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
  ]);
});

test('insertChorusSeparators returns the input unchanged when no line repeats', () => {
  const lines = ['一行目', '二行目', '三行目'];
  assert.deepEqual(insertChorusSeparators(lines), lines);
});

test('insertChorusSeparators wraps every occurrence when the same line wins both roles, but never at the very start or end', () => {
  const lines = ['サビ', 'verse', 'サビ'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, ['サビ', CHORUS_SEPARATOR, 'verse', CHORUS_SEPARATOR, 'サビ']);
});

test('insertChorusSeparators picks the top winner by earliest first occurrence and the bottom winner by latest last occurrence among ties, but never separates at the very start or end', () => {
  const lines = ['A', 'B', 'A', 'B'];
  const result = insertChorusSeparators(lines);
  // A ties B on count; A occurs first (top winner, marked above), B occurs last (bottom winner, marked below).
  // A is the first line and B is the last line, so their separators are suppressed.
  assert.deepEqual(result, ['A', 'B', CHORUS_SEPARATOR, CHORUS_SEPARATOR, 'A', 'B']);
});

test('insertChorusSeparators splits only the instance that is double or more of the smallest instance', () => {
  // TOP/BOT each repeat twice, so TOP wins the "top" role (earlier first occurrence)
  // and BOT wins the "bottom" role (later last occurrence). Instance 1 (TOP..BOT) is
  // 2 lines - the smallest. Instance 2 (TOP..BOT) is 4 lines, which is >= 2x the
  // smallest, so it gets an extra separator 2 lines below its top separator.
  const lines = ['TOP', 'BOT', 'mid1', 'mid2', 'TOP', 'filler1', 'filler2', 'BOT'];
  const result = insertChorusSeparators(lines);
  // TOP is the first line and BOT is the last line, so their separators are suppressed.
  assert.deepEqual(result, [
    'TOP',
    'BOT',
    CHORUS_SEPARATOR,
    'mid1',
    'mid2',
    CHORUS_SEPARATOR,
    'TOP',
    'filler1',
    CHORUS_SEPARATOR,
    'filler2',
    'BOT',
  ]);
});

test('insertChorusSeparators also splits above the bottom separator when triple or more of the smallest instance', () => {
  // TOP/BOT again: instance 1 (TOP..BOT) is 2 lines - the smallest. Instance 2 is 7
  // lines, which is >= 3x the smallest (2), so it gets a second extra separator
  // 2 lines above its bottom separator, in addition to the one 2 lines below its top.
  const lines = ['TOP', 'BOT', 'mid1', 'mid2', 'TOP', 'a', 'b', 'c', 'd', 'e', 'BOT'];
  const result = insertChorusSeparators(lines);
  // TOP is the first line and BOT is the last line, so their separators are suppressed.
  assert.deepEqual(result, [
    'TOP',
    'BOT',
    CHORUS_SEPARATOR,
    'mid1',
    'mid2',
    CHORUS_SEPARATOR,
    'TOP',
    'a',
    CHORUS_SEPARATOR,
    'b',
    'c',
    'd',
    CHORUS_SEPARATOR,
    'e',
    'BOT',
  ]);
});

test('insertChorusSeparators picks a different top winner when the most-repeated line would otherwise win both roles', () => {
  // "今でもあなたはわたしの光" repeats 3 times (the overall most common line) and
  // naturally wins the bottom role. Since top and bottom can't be the same line,
  // the top role falls to the earliest-first-occurrence line among the next most
  // common (count 2): "あの日の悲しみさえ あの日の苦しみさえ".
  const lines = [
    '夢ならばどれほどよかったでしょう',
    '未だにあなたのことを夢にみる',
    '忘れた物を取りに帰るように',
    '古びた思い出の埃を払う',
    '戻らない幸せがあることを',
    '最後にあなたが教えてくれた',
    '言えずに隠してた昏い過去も',
    'あなたがいなきゃ永遠に昏いまま',
    'きっともうこれ以上傷つくことなど',
    'ありはしないとわかっている',
    'あの日の悲しみさえ あの日の苦しみさえ',
    'そのすべてを愛してた あなたとともに',
    '胸に残り離れない 苦いレモンの匂い',
    '雨が降り止むまでは帰れない',
    '今でもあなたはわたしの光',
    '暗闇であなたの背をなぞった',
    'その輪郭を鮮明に覚えている',
    '受け止めきれないものと出会うたび',
    '溢れてやまないのは涙だけ',
    '何をしていたの 何を見ていたの',
    'わたしの知らない横顔で',
    'どこかであなたが今',
    'わたしと同じ様な',
    '涙にくれ淋しさの中にいるなら',
    'わたしのことなどどうか忘れてください',
    'そんなことを心から願うほどに',
    '今でもあなたはわたしの光',
    '自分が思うより 恋をしていたあなたに',
    'あれから思うように 息ができない',
    'あんなに側にいたのに まるで嘘みたい',
    'とても忘れられない それだけが確か',
    'あの日の悲しみさえ あの日の苦しみさえ',
    'そのすべてを愛してた あなたとともに',
    '胸に残り離れない苦いレモンの匂い',
    '雨が降り止むまでは帰れない',
    '切り分けた果実の片方の様に',
    '今でもあなたはわたしの光',
  ];

  const result = insertChorusSeparators(lines);

  assert.equal(result[10], CHORUS_SEPARATOR); // above line 11 (index 10)
  assert.equal(result[11], 'あの日の悲しみさえ あの日の苦しみさえ');
  assert.equal(result[result.indexOf('今でもあなたはわたしの光') + 1], CHORUS_SEPARATOR); // below first occurrence (line 15)
  // The last occurrence (line 37) is also the last line of the input, so its
  // separator is suppressed - no separator at the very end of the output.
  assert.equal(result[result.length - 1], '今でもあなたはわたしの光');
  assert.equal(result.filter((line) => line === CHORUS_SEPARATOR).length, 4);
});

test('insertChorusSeparators ignores blank lines when counting repeats', () => {
  const lines = ['', '', '', 'サビ', '間奏', 'サビ'];
  const result = insertChorusSeparators(lines);
  // The last occurrence of 'サビ' is also the last line, so its separator is suppressed.
  assert.deepEqual(result, ['', '', '', CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR, '間奏', CHORUS_SEPARATOR, 'サビ']);
});

test('insertChorusSeparators never places a separator as the very first or very last element', () => {
  const lines = ['サビ', 'verse1', 'サビ', 'verse2', 'サビ'];
  const result = insertChorusSeparators(lines);
  assert.notEqual(result[0], CHORUS_SEPARATOR);
  assert.notEqual(result[result.length - 1], CHORUS_SEPARATOR);
  assert.deepEqual(result, ['サビ', CHORUS_SEPARATOR, 'verse1', CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR, 'verse2', CHORUS_SEPARATOR, 'サビ']);
});
