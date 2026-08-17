export const CHORUS_SEPARATOR = '-----------------------------';

/**
 * Finds the line with the most repeats (ties broken by earliest first
 * occurrence, via Map insertion order) and inserts CHORUS_SEPARATOR above
 * every occurrence of that line. Blank/whitespace-only lines are ignored
 * when counting repeats. If no line repeats, the input is returned as-is.
 */
export const insertChorusSeparators = (lines: string[]): string[] => {
  const counts = new Map<string, number>();

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }

  let winner: string | undefined;
  let winnerCount = 1;

  for (const [line, count] of counts) {
    if (count > winnerCount) {
      winner = line;
      winnerCount = count;
    }
  }

  if (!winner) {
    return lines.slice();
  }

  const result: string[] = [];
  for (const line of lines) {
    if (line === winner) {
      result.push(CHORUS_SEPARATOR);
    }
    result.push(line);
  }
  return result;
};
