/**
 * @file puzzle.ts
 *
 * Word list loading and daily/random/fixed word selection.
 * This slice owns the game-initialization concern of *which word to play* —
 * distinct from what a word structurally is (src/lib/word/).
 *
 * loadWords performs I/O; all other exports are pure.
 * No React. No game-state knowledge beyond the initial word choice.
 */

import { decompose } from "../character/character";
import type { Character } from "../character/character";
import { createWord, wordToString } from "../word/word";
import type { Word } from "../word/word";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Strategy for selecting a word from the loaded word list. */
export type WordSelectionStrategy =
  | { kind: "daily" }
  | { kind: "random" }
  | { kind: "fixed"; word: string }
  | { kind: "byDate"; date: string }; // ISO date 'YYYY-MM-DD'

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Fetches and validates the word list from `public/data/words.json`.
 * Entries that fail createWord validation are silently dropped.
 *
 * @returns The validated word list
 */
export async function loadWords(): Promise<readonly Word[]> {
  const response = await fetch("/data/words.json");
  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) return [];
  const words: Word[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const word = createWord(entry);
    if (word !== null) words.push(word);
  }
  return words;
}

/**
 * Selects a word from the list by the given strategy.
 *
 * - `daily`: date-seeded deterministic selection using today's date
 * - `random`: uniform random selection
 * - `fixed`: returns the word matching the given string (falls back to first)
 * - `byDate`: selects as if today were the given ISO date ('YYYY-MM-DD')
 *
 * @param words - Non-empty validated word list
 * @param strategy - Selection strategy
 * @returns A Word from the list
 */
export function selectWord(words: readonly Word[], strategy: WordSelectionStrategy): Word {
  switch (strategy.kind) {
    case "daily":
      return wordForDate(words, todayIso());
    case "byDate":
      return wordForDate(words, strategy.date);
    case "random":
      return words[Math.floor(Math.random() * words.length)]!;
    case "fixed": {
      const found = words.find((w) => wordToString(w) === strategy.word);
      return found ?? words[0]!;
    }
  }
}

/**
 * Fully decomposes an array of Characters to basic single-jamo Characters by
 * recursively applying `decompose` until all Characters are irreducible.
 *
 * @param characters - A Word or any array of Characters to decompose
 * @returns Flat ordered array of basic single-jamo Characters
 */
export function fullDecompose(characters: readonly Character[]): readonly Character[] {
  const decomposed = characters.flatMap((c) => decompose(c) ?? [c]);
  return decomposed.length === characters.length ? decomposed : fullDecompose(decomposed);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's date as an ISO string ('YYYY-MM-DD') in local time.
 * @internal
 */
function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Selects a deterministic word for a given ISO date by converting the date
 * to integer days since the Unix epoch and taking the modulo of the list length.
 * @internal
 */
function wordForDate(words: readonly Word[], isoDate: string): Word {
  const ms = new Date(isoDate).getTime();
  const dayIndex = Math.floor(ms / 86_400_000);
  return words[((dayIndex % words.length) + words.length) % words.length]!;
}
