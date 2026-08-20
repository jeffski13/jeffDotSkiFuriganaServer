import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORUS_SEPARATOR, insertChorusSeparators, isNonProductionEnvironment } from './chorusSeparators.ts';

test('isNonProductionEnvironment returns false when NODE_ENV is production', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.equal(isNonProductionEnvironment(), false);
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('isNonProductionEnvironment returns true when NODE_ENV is not production', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    assert.equal(isNonProductionEnvironment(), true);
  } finally {
    process.env.NODE_ENV = original;
  }
});

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
  // A is the first line and B is the last line, so their separators are suppressed. B's bottom separator and
  // A's top separator land back to back (no line between them), so they collapse into one.
  assert.deepEqual(result, ['A', 'B', CHORUS_SEPARATOR, 'A', 'B']);
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

test('insertChorusSeparators treats lines as the same when they only differ by spacing', () => {
  // 'サビ' and 'サ ビ' are the same line once whitespace is stripped for
  // comparison, so they should both count as occurrences of the winner - but
  // the original spacing of each occurrence is preserved in the output.
  const lines = ['サビ', 'verse', 'サ ビ'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, ['サビ', CHORUS_SEPARATOR, 'verse', CHORUS_SEPARATOR, 'サ ビ']);
});

test('insertChorusSeparators never places a separator as the very first or very last element', () => {
  const lines = ['サビ', 'verse1', 'サビ', 'verse2', 'サビ'];
  const result = insertChorusSeparators(lines);
  assert.notEqual(result[0], CHORUS_SEPARATOR);
  assert.notEqual(result[result.length - 1], CHORUS_SEPARATOR);
  assert.deepEqual(result, ['サビ', CHORUS_SEPARATOR, 'verse1', CHORUS_SEPARATOR, 'サビ', CHORUS_SEPARATOR, 'verse2', CHORUS_SEPARATOR, 'サビ']);
});

test('insertChorusSeparators moves the top separator up one line when the line above it repeats across instances', () => {
  // TOP occurs 3 times, so it beats 'echo' (count 2) for the top role outright.
  // BOT occurs 3 times with the latest last occurrence, so it wins the bottom role.
  // 'echo' sits directly above TOP's 1st and 2nd occurrences (a repeated match),
  // so every top separator should move up one line to absorb it. The 3rd
  // occurrence's line above ('unique3') doesn't match anything, but it still
  // moves in lockstep since the rule moves *all* top separators together.
  // The line above the new position (index 0) doesn't exist, so it stops there
  // after exactly one move.
  const lines = ['echo', 'TOP', 'gap1', 'BOT', 'gap2', 'echo', 'TOP', 'gap3', 'BOT', 'gap4', 'unique3', 'TOP', 'gap5', 'BOT'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, [
    'echo',
    'TOP',
    'gap1',
    'BOT',
    CHORUS_SEPARATOR,
    'gap2',
    CHORUS_SEPARATOR,
    'echo',
    'TOP',
    'gap3',
    'BOT',
    CHORUS_SEPARATOR,
    'gap4',
    CHORUS_SEPARATOR,
    'unique3',
    'TOP',
    'gap5',
    'BOT',
  ]);
});

test('insertChorusSeparators moves the bottom separator down one line when the line below it repeats across instances', () => {
  // Mirror of the top-moving-up case: BOT occurs 3 times and wins the bottom role
  // (latest last occurrence). TOP occurs 3 times at the very start of each
  // section (so its own extension check breaks immediately with no line above).
  // 'echo2' sits directly below BOT's 1st and 2nd occurrences, so every bottom
  // separator moves down one line to absorb it; the 3rd occurrence's line below
  // ('unique_end') doesn't match, but moves along with the rest. The line below
  // the new position is the very last line, so it stops there after one move.
  const lines = ['TOP', 'gap1', 'BOT', 'echo2', 'gap2', 'TOP', 'gap3', 'BOT', 'echo2', 'gap4', 'TOP', 'gap5', 'BOT', 'unique_end'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, [
    'TOP',
    'gap1',
    'BOT',
    'echo2',
    CHORUS_SEPARATOR,
    'gap2',
    CHORUS_SEPARATOR,
    'TOP',
    'gap3',
    'BOT',
    'echo2',
    CHORUS_SEPARATOR,
    'gap4',
    CHORUS_SEPARATOR,
    'TOP',
    'gap5',
    'BOT',
    'unique_end',
  ]);
});

test('insertChorusSeparators stops extending the top separator after 5 attempts even if the line above still repeats', () => {
  // TOP occurs 3 times (count 3 beats every F-level's count of 2 outright).
  // BOT occurs 3 times with the latest last occurrence, winning the bottom role.
  // The 1st and 2nd TOP occurrences are each preceded by the same chain
  // F5,F4,F3,F2,F1,F0 (F0 closest to TOP) - every level matches, which would
  // keep moving the top separator up forever without a cap. The 3rd occurrence
  // is preceded by a non-matching chain (U5..U0) and just rides along.
  // With the 5-attempt cap, the separator should end up just above F4 (5 moves:
  // absorbing F0, F1, F2, F3, then landing above F4) - F5 is never reached even
  // though it would also have matched.
  //
  // Additionally, the pair "F0" followed by "TOP" occurs twice as a unit (once
  // in each F-chain), and neither occurrence has a separator within 4 lines
  // above or 2 lines below it (the boundary separator sits 5 lines above F0 -
  // just outside the window), so the final repeated-pair pass adds a separator
  // above each occurrence's F0.
  const lines = [
    'F5', 'F4', 'F3', 'F2', 'F1', 'F0', 'TOP', 'gapA', 'BOT', 'gapB',
    'F5', 'F4', 'F3', 'F2', 'F1', 'F0', 'TOP', 'gapC', 'BOT', 'gapD',
    'U5', 'U4', 'U3', 'U2', 'U1', 'U0', 'TOP', 'gapE', 'BOT',
  ];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, [
    'F5',
    CHORUS_SEPARATOR,
    'F4',
    'F3',
    'F2',
    'F1',
    CHORUS_SEPARATOR,
    'F0',
    'TOP',
    'gapA',
    'BOT',
    CHORUS_SEPARATOR,
    'gapB',
    'F5',
    CHORUS_SEPARATOR,
    'F4',
    'F3',
    'F2',
    'F1',
    CHORUS_SEPARATOR,
    'F0',
    'TOP',
    'gapC',
    'BOT',
    CHORUS_SEPARATOR,
    'gapD',
    'U5',
    CHORUS_SEPARATOR,
    'U4',
    'U3',
    'U2',
    'U1',
    'U0',
    'TOP',
    'gapE',
    'BOT',
  ]);
});

test('insertChorusSeparators adds a separator above every occurrence of a repeated line pair with no nearby separator', () => {
  // OUTER1/OUTER2 repeat 3 times and win the top/bottom roles, producing their
  // own separators. PAIRA/PAIRB is a *different* pair of lines that only
  // repeats twice as a unit, so it never competes for those roles - the main
  // algorithm leaves it untouched. Both occurrences sit far (5 filler lines)
  // from the nearest separator in either direction, so the final pass should
  // add one above each occurrence's top line.
  const lines = [
    'OUTER1', 'OUTER2',
    'v1', 'v2',
    'OUTER1', 'OUTER2',
    'v3', 'v4',
    'OUTER1', 'OUTER2',
    'f1', 'f2', 'f3', 'f4', 'f5',
    'PAIRA', 'PAIRB',
    'g1', 'g2', 'g3', 'g4', 'g5',
    'PAIRA', 'PAIRB',
    'tail',
  ];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, [
    'OUTER1', 'OUTER2',
    CHORUS_SEPARATOR,
    'v1', 'v2',
    CHORUS_SEPARATOR,
    'OUTER1', 'OUTER2',
    CHORUS_SEPARATOR,
    'v3', 'v4',
    CHORUS_SEPARATOR,
    'OUTER1', 'OUTER2',
    CHORUS_SEPARATOR,
    'f1', 'f2', 'f3', 'f4', 'f5',
    CHORUS_SEPARATOR,
    'PAIRA', 'PAIRB',
    'g1', 'g2', 'g3', 'g4', 'g5',
    CHORUS_SEPARATOR,
    'PAIRA', 'PAIRB',
    'tail',
  ]);
});

test('insertChorusSeparators does not add a separator above a pair occurrence with a separator within 4 lines above it, but still adds one above a far-away occurrence of the same pair', () => {
  // The 1st PAIRA/PAIRB occurrence only has 2 filler lines (x1, x2) before it,
  // so the OUTER2 separator lands within its 4-line "above" window and it's
  // suppressed. The 2nd occurrence is far (5 filler lines) from every
  // separator - including the one that would otherwise be added above the
  // 1st occurrence, since eligibility is checked once against the
  // pre-insertion output, not chained across occurrences - so it still gets
  // its own separator.
  const lines = [
    'OUTER1', 'OUTER2',
    'v1', 'v2',
    'OUTER1', 'OUTER2',
    'v3', 'v4',
    'OUTER1', 'OUTER2',
    'x1', 'x2',
    'PAIRA', 'PAIRB',
    'g1', 'g2', 'g3', 'g4', 'g5',
    'PAIRA', 'PAIRB',
    'tail',
  ];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, [
    'OUTER1', 'OUTER2',
    CHORUS_SEPARATOR,
    'v1', 'v2',
    CHORUS_SEPARATOR,
    'OUTER1', 'OUTER2',
    CHORUS_SEPARATOR,
    'v3', 'v4',
    CHORUS_SEPARATOR,
    'OUTER1', 'OUTER2',
    CHORUS_SEPARATOR,
    'x1', 'x2',
    'PAIRA', 'PAIRB',
    'g1', 'g2', 'g3', 'g4', 'g5',
    CHORUS_SEPARATOR,
    'PAIRA', 'PAIRB',
    'tail',
  ]);
});

test('insertChorusSeparators does not add a separator when a repeated line pair only occurs once', () => {
  // PAIRA/PAIRB only appears once, so it does not meet the "at least two
  // instances of the pair" threshold and is left untouched, even though it
  // sits far from any separator.
  const lines = ['f1', 'f2', 'f3', 'f4', 'f5', 'PAIRA', 'PAIRB', 'g1', 'g2', 'g3', 'g4', 'g5'];
  assert.deepEqual(insertChorusSeparators(lines), lines);
});

test('insertChorusSeparators collapses adjacent separators into one', () => {
  // BOT's 1st occurrence (index 2) is immediately followed by TOP's 2nd
  // occurrence (index 3) with no line between them, so the raw token stream
  // would place a bottom separator directly next to a top separator. Those
  // should collapse into a single separator.
  const lines = ['pre', 'TOP', 'BOT', 'TOP', 'post', 'BOT', 'tail'];
  const result = insertChorusSeparators(lines);
  assert.deepEqual(result, ['pre', CHORUS_SEPARATOR, 'TOP', 'BOT', CHORUS_SEPARATOR, 'TOP', 'post', 'BOT', CHORUS_SEPARATOR, 'tail']);
});
