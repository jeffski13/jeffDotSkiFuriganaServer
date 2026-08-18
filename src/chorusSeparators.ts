export const CHORUS_SEPARATOR = '-----------------------------';

type Token = { kind: 'line'; text: string } | { kind: 'sep'; type: 'top' | 'bottom' };

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
 * input is returned as-is.
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
 */
export const insertChorusSeparators = (lines: string[]): string[] => {
  const counts = new Map<string, number>();
  const firstIndex = new Map<string, number>();
  const lastIndex = new Map<string, number>();

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      return;
    }
    counts.set(line, (counts.get(line) ?? 0) + 1);
    if (!firstIndex.has(line)) {
      firstIndex.set(line, index);
    }
    lastIndex.set(line, index);
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

  const tokens: Token[] = [];
  for (const line of lines) {
    if (line === topWinner) {
      tokens.push({ kind: 'sep', type: 'top' });
    }
    tokens.push({ kind: 'line', text: line });
    if (line === bottomWinner) {
      tokens.push({ kind: 'sep', type: 'bottom' });
    }
  }

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
    return tokens.map((token) => (token.kind === 'sep' ? CHORUS_SEPARATOR : token.text));
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
  return result;
};
