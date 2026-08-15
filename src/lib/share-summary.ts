import type { GuessRecord } from "./engine";

const GAME_TITLE = "빙글빙글";
const MAX_SHARE_GRID_ROWS = 9;
const COMPRESSED_HEAD_ROWS = 4;
const COMPRESSED_TAIL_ROWS = 4;
const CORRECT_EMOJI = "🟩";
const PRESENT_EMOJI = "🟨";
const ABSENT_EMOJI = "⬜";
const NO_SUBMISSION_EMOJI = "⬛";
const OMITTED_GUESS_MARKER = "➖";

type BuildShareSummaryOptions = {
  /** Solved game history, in submission order. */
  history: readonly GuessRecord[];
  /** Local puzzle date as `YYYY-MM-DD`. Defaults to the current local date. */
  date?: string | undefined;
};

type CompactedGridLine = {
  /** Emoji pattern for one or more consecutive equivalent guesses. */
  line: string;
  /** Number of consecutive guesses represented by this line. */
  count: number;
};

/** Builds the text copied by the win-panel share button. */
export function buildShareSummary({
  history,
  date = localIsoDate(),
}: BuildShareSummaryOptions): string {
  const header = `${GAME_TITLE} ${formatKoreanMonthDay(date)} · ${formatDifficulty(history)} · ${history.length}회`;
  const gridLines = compressGridLines(history.map(guessRecordToEmojiLine));
  return [header, ...gridLines].join("\n");
}

function guessRecordToEmojiLine(guessRecord: GuessRecord): string {
  return guessRecord
    .map((evaluatedCharacter) => {
      if (evaluatedCharacter.result === "CORRECT") return CORRECT_EMOJI;
      if (evaluatedCharacter.result === "PRESENT") return PRESENT_EMOJI;
      return evaluatedCharacter.character === undefined ? NO_SUBMISSION_EMOJI : ABSENT_EMOJI;
    })
    .join("");
}

function compressGridLines(lines: readonly string[]): readonly string[] {
  const compactedLines = compactRepeatedLines(lines);
  if (compactedLines.length <= MAX_SHARE_GRID_ROWS) return compactedLines.map(formatCompactedLine);

  const omittedLines = compactedLines.slice(COMPRESSED_HEAD_ROWS, -COMPRESSED_TAIL_ROWS);
  const omittedCount = omittedLines.reduce((total, line) => total + line.count, 0);
  const gridWidth = firstEmojiLineWidth(lines);
  const omittedLine = `${OMITTED_GUESS_MARKER.repeat(gridWidth)} +${omittedCount}`;

  return [
    ...compactedLines.slice(0, COMPRESSED_HEAD_ROWS).map(formatCompactedLine),
    omittedLine,
    ...compactedLines.slice(-COMPRESSED_TAIL_ROWS).map(formatCompactedLine),
  ];
}

function compactRepeatedLines(lines: readonly string[]): readonly CompactedGridLine[] {
  const linesBeforeFinalGuess = lines.slice(0, -1);
  const finalGuessLine = lines[lines.length - 1];
  const compactedLines: CompactedGridLine[] = [];

  linesBeforeFinalGuess.forEach((line) => {
    const previousLine = compactedLines[compactedLines.length - 1];
    if (previousLine?.line === line) {
      previousLine.count += 1;
      return;
    }

    compactedLines.push({ line, count: 1 });
  });

  if (finalGuessLine !== undefined) compactedLines.push({ line: finalGuessLine, count: 1 });
  return compactedLines;
}

function formatCompactedLine({ line, count }: CompactedGridLine): string {
  return count === 1 ? line : `${line} ×${count}`;
}

function firstEmojiLineWidth(lines: readonly string[]): number {
  const firstLine = lines[0];
  if (firstLine === undefined) return 0;
  return [...firstLine].length;
}

function formatKoreanMonthDay(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) return date;

  const [, , month, day] = match;
  return `${Number(month)}/${Number(day)}`;
}

function formatDifficulty(history: readonly GuessRecord[]): string {
  return `${history[0]?.length ?? 0}칸`;
}

function localIsoDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
