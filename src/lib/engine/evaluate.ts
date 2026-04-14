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
import type { EvaluatedCharacter, GuessRecord } from "./engine";

/**
 * Evaluates a submission against the target word using two-pass Wordle semantics.
 *
 * Pass 1: marks exact position matches as 'CORRECT' and removes them from the
 * available target pool. Pass 2: marks remaining filled slots as 'PRESENT' if
 * the character exists in the remaining pool, otherwise 'ABSENT'. Empty slots
 * always produce `{ result: 'ABSENT' }` with no `character` property.
 *
 * @param submission - The current submission state
 * @param word - The target word to evaluate against
 * @returns A GuessRecord with per-character evaluation results
 */
export function evaluateGuess(submission: SubmissionState, word: Word): GuessRecord {
  // Resolve each slot to a string for comparison only — Character is stored directly in results
  const submitted = submission.map((slot) =>
    slot.state === "FILLED"
      ? { str: resolveCharacter(slot.character) ?? "", char: slot.character }
      : { str: "", char: undefined },
  );

  // Resolve the target word to strings for comparison
  const targetStrings = word.map((char) => resolveCharacter(char) ?? "");

  // Track which target positions are still available after pass 1
  const targetAvailable = targetStrings.map(() => true);

  // Results array — initialised as ABSENT, filled in by the two passes
  const results: EvaluatedCharacter[] = submitted.map(({ char }) =>
    char !== undefined
      ? { character: char, result: "ABSENT" as const }
      : { result: "ABSENT" as const },
  );

  // Pass 1: exact matches
  submitted.forEach(({ str, char }, i) => {
    if (str !== "" && str === targetStrings[i]) {
      // str !== '' guarantees char is defined (slot was filled)
      results[i] = { character: char!, result: "CORRECT" };
      targetAvailable[i] = false;
    }
  });

  // Pass 2: present / absent for remaining filled slots
  submitted.forEach(({ str, char }, i) => {
    // results has the same length as submitted — results[i] is always defined here
    if (str === "" || results[i]!.result === "CORRECT") return;

    const matchIndex = targetStrings.findIndex((target, j) => targetAvailable[j] && target === str);

    if (matchIndex !== -1) {
      // str !== '' guarantees char is defined (slot was filled)
      results[i] = { character: char!, result: "PRESENT" };
      targetAvailable[matchIndex] = false;
    }
  });

  return results;
}
