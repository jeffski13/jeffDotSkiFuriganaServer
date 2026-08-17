export const CHORUS_SEPARATOR = '-----------------------------';

/**
 * Marks the boundaries of the most-repeated block of lines:
 *  - the "top" line (most repeats, ties broken by earliest first
 *    occurrence) gets CHORUS_SEPARATOR inserted above every occurrence.
 *  - the "bottom" line (most repeats, ties broken by latest last
 *    occurrence) gets CHORUS_SEPARATOR inserted below every occurrence.
 * When there's no tie, both roles land on the same line, so it gets
 * wrapped above and below. Blank/whitespace-only lines are ignored when
 * counting repeats. If no line repeats, the input is returned as-is.
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

  let topWinner: string | undefined;
  let topCount = 0;
  let bottomWinner: string | undefined;
  let bottomCount = 0;

  for (const [line, count] of counts) {
    if (count < 2) {
      continue;
    }

    if (topWinner === undefined || count > topCount || (count === topCount && firstIndex.get(line)! < firstIndex.get(topWinner)!)) {
      topWinner = line;
      topCount = count;
    }

    if (bottomWinner === undefined || count > bottomCount || (count === bottomCount && lastIndex.get(line)! > lastIndex.get(bottomWinner)!)) {
      bottomWinner = line;
      bottomCount = count;
    }
  }

  if (!topWinner && !bottomWinner) {
    return lines.slice();
  }

  const result: string[] = [];
  for (const line of lines) {
    if (line === topWinner) {
      result.push(CHORUS_SEPARATOR);
    }
    result.push(line);
    if (line === bottomWinner) {
      result.push(CHORUS_SEPARATOR);
    }
  }
  return result;
};
