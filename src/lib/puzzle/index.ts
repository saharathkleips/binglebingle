/**
 * @file index.ts
 *
 * Daily word schedule loading and selection.
 * This slice owns the game-initialization concern of *which word to play* —
 * distinct from what a word structurally is (src/lib/word/).
 *
 * loadDailyWords performs I/O; all other exports are pure.
 * No React. No game-state knowledge beyond the initial word choice.
 */

import { createWord } from "../word";
import type { Word } from "../word";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported puzzle difficulty, expressed as the target word length in syllables. */
export type Difficulty = 3 | 4 | 5;

/** All currently supported puzzle difficulties. */
export const DIFFICULTIES: readonly Difficulty[] = [3, 4, 5];

/** A curated daily puzzle entry loaded from the per-difficulty daily schedule. */
export type DailyWordEntry = {
  /** Local ISO date (`YYYY-MM-DD`) when this word should be used. */
  date: string;
  /** Validated target word for the entry's difficulty. */
  word: Word;
};

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Fetches and validates the curated daily schedule for one difficulty.
 * Entries that do not match `{ date: string, word: string }`, fail word validation,
 * or contain a word for another difficulty are silently dropped.
 */
export async function loadDailyWords(difficulty: Difficulty): Promise<readonly DailyWordEntry[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/daily/${difficulty}.json`);
  if ("ok" in response && !response.ok) return [];
  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) return [];

  const entries: DailyWordEntry[] = [];
  for (const entry of raw) {
    if (!isRawDailyWordEntry(entry)) continue;
    const word = createWord(entry.word);
    if (word !== null && word.length === difficulty) entries.push({ date: entry.date, word });
  }
  return entries;
}

/** Returns whether a word length is one of the supported difficulty levels. */
export function isSupportedDifficulty(length: number): length is Difficulty {
  return DIFFICULTIES.includes(length as Difficulty);
}

/** Returns today's date as an ISO string ('YYYY-MM-DD') in local time. */
export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns the word explicitly scheduled for a local ISO date, if present. */
export function selectDailyWord(entries: readonly DailyWordEntry[], date: string): Word | null {
  return entries.find((entry) => entry.date === date)?.word ?? null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isRawDailyWordEntry(entry: unknown): entry is { date: string; word: string } {
  if (typeof entry !== "object" || entry === null) return false;
  const candidate = entry as Partial<Record<"date" | "word", unknown>>;
  return typeof candidate.date === "string" && typeof candidate.word === "string";
}
