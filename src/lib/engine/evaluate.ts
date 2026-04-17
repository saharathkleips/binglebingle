/**
 * @file evaluate.ts
 *
 * Guess evaluation for the engine slice.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { resolveCharacter } from "../character";
import type { Word } from "../word/word";
import type { GuessRecord, Submission } from "./index";

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
export function evaluateGuess(submission: Submission, word: Word): GuessRecord {
  const slots = submission.map((char) =>
    char !== null
      ? { resolved: resolveCharacter(char) ?? "", character: char }
      : { resolved: "", character: undefined },
  );
  const targetStrings = word.map((wordChar) => resolveCharacter(wordChar) ?? "");

  // Pass 1: mark target positions consumed by exact matches as unavailable
  const targetAvailable = targetStrings.map((targetString, i) => {
    const slotString = slots[i]?.resolved;
    return !slotString || slotString !== targetString;
  });

  // Pass 2: classify each slot, consuming available positions for PRESENT matches
  return slots.map(({ resolved, character }, i) => {
    if (!resolved) return { result: "ABSENT" as const };
    if (resolved === targetStrings[i]) return { character: character!, result: "CORRECT" as const };
    const matchedTargetIdx = targetStrings.findIndex(
      (targetString, targetIdx) => targetAvailable[targetIdx] && targetString === resolved,
    );
    if (matchedTargetIdx !== -1) {
      targetAvailable[matchedTargetIdx] = false;
      return { character: character!, result: "PRESENT" as const };
    }
    return { character: character!, result: "ABSENT" as const };
  });
}
