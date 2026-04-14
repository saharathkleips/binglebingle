/**
 * @file evaluate.ts
 *
 * Guess evaluation for the engine slice.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { resolveCharacter } from "../character/character";
import type { SubmissionState } from "../../state/types";
import type { Word } from "../word/word";
import type { EvaluatedCharacter, GuessRecord } from "./types";

/**
 * Evaluates a submission against the target word using two-pass Wordle semantics.
 *
 * Pass 1: marks exact position matches as 'correct' and removes them from the
 * available target pool. Pass 2: marks remaining filled slots as 'present' if
 * the character exists in the remaining pool, otherwise 'absent'. Empty slots
 * always produce `{ character: '', result: 'absent' }`.
 *
 * @param submission - The current submission state
 * @param word - The target word to evaluate against
 * @returns A GuessRecord with per-character evaluation results
 */
export function evaluateGuess(submission: SubmissionState, word: Word): GuessRecord {
  // Resolve each submission slot to a string ('' for empty)
  const submittedStrings = submission.map((slot) =>
    slot.filled ? (resolveCharacter(slot.character) ?? "") : "",
  );

  // Resolve the target word to strings for comparison
  const targetStrings = word.map((char) => resolveCharacter(char) ?? "");

  // Track which target positions are still available after pass 1
  const targetAvailable = targetStrings.map(() => true);

  // Results array — initialised as absent, filled in by the two passes
  const results: EvaluatedCharacter[] = submittedStrings.map((char) => ({
    character: char,
    result: "absent" as const,
  }));

  // Pass 1: exact matches
  submittedStrings.forEach((char, i) => {
    if (char !== "" && char === targetStrings[i]) {
      results[i] = { character: char, result: "correct" };
      targetAvailable[i] = false;
    }
  });

  // Pass 2: present / absent for remaining filled slots
  submittedStrings.forEach((char, i) => {
    // results has the same length as submittedStrings — results[i] is always defined here
    if (char === "" || results[i]!.result === "correct") return;

    const matchIndex = targetStrings.findIndex(
      (target, j) => targetAvailable[j] && target === char,
    );

    if (matchIndex !== -1) {
      results[i] = { character: char, result: "present" };
      targetAvailable[matchIndex] = false;
    }
  });

  return results;
}
