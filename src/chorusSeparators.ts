export const CHORUS_SEPARATOR = '-----------------------------';

export const isNonProductionEnvironment = (): boolean => process.env.NODE_ENV !== 'production';

// Guards against runaway extension of the chorus boundaries.
const MAX_BOUNDARY_EXTENSIONS = 5;

type Token = { kind: 'line'; text: string } | { kind: 'sep'; type: 'top' | 'bottom' };

// Lines are compared for similarity with all whitespace stripped out, so two
// lines that differ only in spacing are still treated as the same line.
const normalizeForComparison = (line: string): string => line.replace(/\s+/g, '');

// True if the same non-blank value appears at least twice in values.
const hasRepeatedLine = (values: string[]): boolean => {
  const seen = new Set<string>();
  for (const value of values) {
    if (value.trim() === '') {
      continue;
    }
    const key = normalizeForComparison(value);
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }
  return false;
};

/**
 * Marks the boundaries of the most-repeated block of lines:
 *  - the "bottom" line (most repeats, ties broken by latest last
 *    occurrence) gets CHORUS_SEPARATOR inserted below every occurrence.
 *  - the "top" line (most repeats among lines other than the bottom
 *    winner, ties broken by earliest first occurrence) gets
 *    CHORUS_SEPARATOR inserted above every occurrence.
 * The top and bottom winners are never the same line, unless the bottom
 * winner is the only line that repeats at all - in that case it wins
 * both roles and gets wrapped above and below. Blank/whitespace-only
 * lines are ignored when counting repeats. If no line repeats, the
 * input is returned as-is. No separator is ever inserted at the very
 * beginning or the very end of the output, even if the top or bottom
 * winner's first/last occurrence is the first/last line.
 *
 * Once the top and bottom separators are placed, each boundary is checked
 * for extension: if the line directly above the topmost separator repeats
 * (at least two occurrences share the same, non-blank text) across the
 * top separator's instances, every top separator moves up one line to
 * absorb it, and the check repeats against the new line above - up to
 * MAX_BOUNDARY_EXTENSIONS times. The bottommost separator is extended
 * the same way in the opposite direction, checking the line below and
 * moving every bottom separator down one line, also capped at
 * MAX_BOUNDARY_EXTENSIONS times.
 *
 * A second pass then looks at every "top" separator immediately followed,
 * with no other separator in between, by a "bottom" separator - i.e. a
 * full instance of the repeated block - and finds the shortest such
 * instance (smallestNumOfLines). Any instance with double or more that
 * many lines gets an extra separator inserted smallestNumOfLines lines
 * below its top separator. If what's left below that split is itself
 * double or more of smallestNumOfLines (i.e. the instance is triple or
 * more of smallestNumOfLines), it also gets a separator inserted
 * smallestNumOfLines lines above its bottom separator. This pass runs
 * once, against the original top/bottom separators only.
 *
 * Finally, any run of adjacent separators (e.g. a bottom separator
 * immediately followed by a top separator with no line between them) is
 * collapsed down to a single separator.
 *
 * After all of the above, a last pass looks for any two consecutive lines
 * (ignoring blank lines) whose ordered pair - this line followed by the
 * next - appears at least twice somewhere in the song. For each occurrence
 * of such a pair, if no separator already appears within the 4 lines above
 * the top line of the pair, and no separator already appears within the 2
 * lines below the bottom line of the pair, a separator is inserted above
 * the top line. This pass runs once, against the fully-processed output of
 * everything above.
 *
 * Throughout, lines are compared for similarity with all whitespace
 * stripped out, so two lines that differ only in spacing are treated as
 * the same line - the original spacing is preserved in the output.
 */
export const insertChorusSeparators = (lines: string[]): string[] => {
  const counts = new Map<string, number>();
  const firstIndex = new Map<string, number>();
  const lastIndex = new Map<string, number>();

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      return;
    }
    const key = normalizeForComparison(line);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!firstIndex.has(key)) {
      firstIndex.set(key, index);
    }
    lastIndex.set(key, index);
  });

  let bottomWinner: string | undefined;
  let bottomCount = 0;

  for (const [line, count] of counts) {
    if (count < 2) {
      continue;
    }

    if (bottomWinner === undefined || count > bottomCount || (count === bottomCount && lastIndex.get(line)! > lastIndex.get(bottomWinner)!)) {
      bottomWinner = line;
      bottomCount = count;
    }
  }

  let topWinner: string | undefined;
  let topCount = 0;

  for (const [line, count] of counts) {
    if (count < 2 || line === bottomWinner) {
      continue;
    }

    if (topWinner === undefined || count > topCount || (count === topCount && firstIndex.get(line)! < firstIndex.get(topWinner)!)) {
      topWinner = line;
      topCount = count;
    }
  }

  if (topWinner === undefined) {
    topWinner = bottomWinner;
  }

  if (!topWinner && !bottomWinner) {
    return lines.slice();
  }

  if (isNonProductionEnvironment()) {
    console.log('Topmost common line:', topWinner);
    console.log('Bottommost common line:', bottomWinner);
  }

  let topBoundaryIndexes: number[] = [];
  let bottomBoundaryIndexes: number[] = [];
  lines.forEach((line, index) => {
    const key = normalizeForComparison(line);
    if (key === topWinner) {
      topBoundaryIndexes.push(index);
    }
    if (key === bottomWinner) {
      bottomBoundaryIndexes.push(index);
    }
  });

  for (let attempt = 0; attempt < MAX_BOUNDARY_EXTENSIONS; attempt++) {
    if (topBoundaryIndexes.some((index) => index === 0)) {
      break;
    }
    const linesAbove = topBoundaryIndexes.map((index) => lines[index - 1]);
    if (!hasRepeatedLine(linesAbove)) {
      break;
    }
    topBoundaryIndexes = topBoundaryIndexes.map((index) => index - 1);
  }

  for (let attempt = 0; attempt < MAX_BOUNDARY_EXTENSIONS; attempt++) {
    if (bottomBoundaryIndexes.some((index) => index === lines.length - 1)) {
      break;
    }
    const linesBelow = bottomBoundaryIndexes.map((index) => lines[index + 1]);
    if (!hasRepeatedLine(linesBelow)) {
      break;
    }
    bottomBoundaryIndexes = bottomBoundaryIndexes.map((index) => index + 1);
  }

  const topBoundarySet = new Set(topBoundaryIndexes);
  const bottomBoundarySet = new Set(bottomBoundaryIndexes);

  const tokens: Token[] = [];
  lines.forEach((line, index) => {
    if (topBoundarySet.has(index)) {
      tokens.push({ kind: 'sep', type: 'top' });
    }
    tokens.push({ kind: 'line', text: line });
    if (bottomBoundarySet.has(index)) {
      tokens.push({ kind: 'sep', type: 'bottom' });
    }
  });

  const sepIndexes: number[] = [];
  tokens.forEach((token, index) => {
    if (token.kind === 'sep') {
      sepIndexes.push(index);
    }
  });

  const instances: Array<{ topSepIndex: number; bottomSepIndex: number; gapLines: number }> = [];
  for (let i = 0; i < sepIndexes.length - 1; i++) {
    const leftIndex = sepIndexes[i];
    const rightIndex = sepIndexes[i + 1];
    const left = tokens[leftIndex] as Extract<Token, { kind: 'sep' }>;
    const right = tokens[rightIndex] as Extract<Token, { kind: 'sep' }>;
    if (left.type === 'top' && right.type === 'bottom') {
      instances.push({ topSepIndex: leftIndex, bottomSepIndex: rightIndex, gapLines: rightIndex - leftIndex - 1 });
    }
  }

  if (instances.length === 0) {
    const withoutExtraSplits = trimBoundarySeparators(collapseAdjacentSeparators(tokens.map((token) => (token.kind === 'sep' ? CHORUS_SEPARATOR : token.text))));
    return insertSeparatorsForRepeatedLinePairs(withoutExtraSplits);
  }

  const smallestNumOfLines = Math.min(...instances.map((instance) => instance.gapLines));

  const insertBefore = new Set<number>();
  if (smallestNumOfLines > 0) {
    for (const instance of instances) {
      if (instance.gapLines >= smallestNumOfLines * 2) {
        insertBefore.add(instance.topSepIndex + 1 + smallestNumOfLines);

        // After the split above, the remainder (gapLines - smallestNumOfLines lines)
        // sits just above the bottom separator. If that remainder is itself double
        // or more of smallestNumOfLines, split it too, smallestNumOfLines lines up
        // from the bottom separator.
        if (instance.gapLines >= smallestNumOfLines * 3) {
          insertBefore.add(instance.bottomSepIndex - smallestNumOfLines);
        }
      }
    }
  }

  const result: string[] = [];
  tokens.forEach((token, index) => {
    if (insertBefore.has(index)) {
      result.push(CHORUS_SEPARATOR);
    }
    result.push(token.kind === 'sep' ? CHORUS_SEPARATOR : token.text);
  });
  const withoutExtraSplits = trimBoundarySeparators(collapseAdjacentSeparators(result));
  return insertSeparatorsForRepeatedLinePairs(withoutExtraSplits);
};

// A separator is never allowed to be the very first or very last element of
// the output, even if the top or bottom winner's first/last occurrence is
// the first/last line - so strip one off either end if present.
const trimBoundarySeparators = (result: string[]): string[] => {
  if (result[0] === CHORUS_SEPARATOR) {
    result = result.slice(1);
  }
  if (result[result.length - 1] === CHORUS_SEPARATOR) {
    result = result.slice(0, -1);
  }
  return result;
};

// Two separators can end up back to back (e.g. a bottom separator immediately
// followed by a top separator with no line between them). Collapse any run of
// adjacent separators down to a single one.
const collapseAdjacentSeparators = (result: string[]): string[] => {
  const collapsed: string[] = [];
  for (const line of result) {
    if (line === CHORUS_SEPARATOR && collapsed[collapsed.length - 1] === CHORUS_SEPARATOR) {
      continue;
    }
    collapsed.push(line);
  }
  return collapsed;
};

const REPEATED_PAIR_ABOVE_RANGE = 4;
const REPEATED_PAIR_BELOW_RANGE = 2;

// Joins a pair of lines into a single key for counting how often that exact
// ordered pair (top followed by bottom) occurs, ignoring whitespace. Each
// half is already stripped of whitespace by normalizeForComparison, so a
// plain space safely delimits the two halves without ambiguity.
const pairKey = (top: string, bottom: string): string => `${normalizeForComparison(top)} ${normalizeForComparison(bottom)}`;

// Final pass: for every pair of consecutive, non-blank lines whose ordered
// pair appears at least twice in the song, insert a separator above the top
// line of each occurrence - unless a separator already sits within the 4
// lines above the top line of that occurrence, or within the 2 lines below
// its bottom line.
const insertSeparatorsForRepeatedLinePairs = (result: string[]): string[] => {
  const isEligiblePair = (top: string, bottom: string): boolean =>
    top !== CHORUS_SEPARATOR && bottom !== CHORUS_SEPARATOR && top.trim() !== '' && bottom.trim() !== '';

  const pairCounts = new Map<string, number>();
  for (let index = 0; index < result.length - 1; index++) {
    const top = result[index];
    const bottom = result[index + 1];
    if (!isEligiblePair(top, bottom)) {
      continue;
    }
    const key = pairKey(top, bottom);
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }

  const insertBefore = new Set<number>();
  for (let index = 0; index < result.length - 1; index++) {
    const top = result[index];
    const bottom = result[index + 1];
    if (!isEligiblePair(top, bottom) || (pairCounts.get(pairKey(top, bottom)) ?? 0) < 2) {
      continue;
    }

    const aboveWindow = result.slice(Math.max(0, index - REPEATED_PAIR_ABOVE_RANGE), index);
    const belowWindow = result.slice(index + 2, index + 2 + REPEATED_PAIR_BELOW_RANGE);

    if (!aboveWindow.includes(CHORUS_SEPARATOR) && !belowWindow.includes(CHORUS_SEPARATOR)) {
      insertBefore.add(index);
      if (isNonProductionEnvironment()) {
        console.log('Repeated line pair marked with a separator:', top, '/', bottom);
      }
    }
  }

  if (insertBefore.size === 0) {
    return result;
  }

  const withSeparators: string[] = [];
  result.forEach((line, index) => {
    if (insertBefore.has(index)) {
      withSeparators.push(CHORUS_SEPARATOR);
    }
    withSeparators.push(line);
  });

  return trimBoundarySeparators(collapseAdjacentSeparators(withSeparators));
};
