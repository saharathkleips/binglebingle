/**
 * @file index.ts
 *
 * Character type definitions and core operations — the primary interface for
 * the game state reducer.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { composeSyllable, decomposeSyllable } from "../jamo/composition";
import type { VowelJamo, Jamo, ChoseongJamo, JongseongJamo } from "../jamo/jamo";
import { CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX } from "../jamo/jamo";

/**
 * A Character that resolves to a complete Korean syllable block (U+AC00–U+D7A3).
 * Either OPEN_SYLLABLE (choseong + jungseong) or FULL_SYLLABLE (choseong + jungseong + jongseong).
 * Use `isComplete(char)` as a type guard to narrow a Character to this type.
 */
export type CompleteCharacter =
  | { kind: "OPEN_SYLLABLE"; choseong: ChoseongJamo; jungseong: VowelJamo }
  | {
      kind: "FULL_SYLLABLE";
      choseong: ChoseongJamo;
      jungseong: VowelJamo;
      jongseong: JongseongJamo;
    };

/**
 * A Korean syllable character under construction, represented as a discriminated
 * union over the six valid slot configurations.
 *
 * - `EMPTY`          — nothing placed yet
 * - `CHOSEONG_ONLY`  — single consonant (may be a double consonant like ㄲ)
 * - `JUNGSEONG_ONLY` — single vowel (may be a complex vowel like ㅘ)
 * - `JONGSEONG_ONLY` — standalone final consonant (compound batchim under construction)
 * - `OPEN_SYLLABLE`  — consonant + vowel (e.g. 가); no final consonant yet  ┐
 * - `FULL_SYLLABLE`  — consonant + vowel + final consonant (e.g. 한)         ┘ CompleteCharacter
 *
 * Use `character({...})` to construct a Character from slot values.
 * Use `compose(a, b)` to advance a Character in a state-machine fashion.
 * Use `resolveCharacter(char)` to render a Character as a Unicode string.
 */
export type Character =
  | { kind: "EMPTY" }
  | { kind: "CHOSEONG_ONLY"; choseong: ChoseongJamo }
  | { kind: "JUNGSEONG_ONLY"; jungseong: VowelJamo }
  | { kind: "JONGSEONG_ONLY"; jongseong: JongseongJamo }
  | CompleteCharacter;

/**
 * Constructs a Character from a Unicode syllable string or from slot values.
 *
 * When called with a string, parses a single Korean syllable block (U+AC00–U+D7A3)
 * and returns a `CompleteCharacter`, or null if the string is not a valid syllable.
 *
 * When called with slots, derives the kind automatically from the provided slot
 * values. Returns null for structurally invalid combinations — jongseong must be a
 * valid final consonant (ㄸ/ㅃ/ㅉ are not), and jungseong + jongseong without
 * choseong is unrepresentable.
 *
 * @param input - A single syllable string, optional slot values, or nothing for EMPTY.
 */
export function character(syllable: string): CompleteCharacter | null;
export function character(slots?: {
  choseong?: Jamo;
  jungseong?: Jamo;
  jongseong?: Jamo;
}): Character | null;
export function character(
  input?: string | { choseong?: Jamo; jungseong?: Jamo; jongseong?: Jamo },
): Character | null {
  if (typeof input === "string") {
    const decomposed = decomposeSyllable(input);
    if (decomposed === null) return null;
    input = decomposed;
  }
  const { choseong, jungseong, jongseong } = input ?? {};
  if (!choseong && !jungseong && !jongseong) return { kind: "EMPTY" };
  if (choseong !== undefined && !(choseong in CHOSEONG_INDEX)) return null;
  if (jungseong !== undefined && !(jungseong in JUNGSEONG_INDEX)) return null;
  if (jongseong !== undefined && !(jongseong in JONGSEONG_INDEX)) return null;
  const cho = choseong as ChoseongJamo | undefined;
  const jung = jungseong as VowelJamo | undefined;
  const jong = jongseong as JongseongJamo | undefined;
  if (cho && jung && jong)
    return { kind: "FULL_SYLLABLE", choseong: cho, jungseong: jung, jongseong: jong };
  if (cho && jung) return { kind: "OPEN_SYLLABLE", choseong: cho, jungseong: jung };
  if (cho) return { kind: "CHOSEONG_ONLY", choseong: cho };
  if (jung && !jong) return { kind: "JUNGSEONG_ONLY", jungseong: jung };
  if (jong && !jung) return { kind: "JONGSEONG_ONLY", jongseong: jong };
  return null; // jungseong + jongseong without choseong is unrepresentable
}

/**
 * Reduces a Character to its rendered Unicode string form.
 *
 * - EMPTY → null
 * - CHOSEONG_ONLY → bare consonant string
 * - JUNGSEONG_ONLY → bare vowel string
 * - JONGSEONG_ONLY → bare consonant string (compound batchim under construction)
 * - OPEN_SYLLABLE → composeSyllable(choseong, jungseong)
 * - FULL_SYLLABLE → composeSyllable(choseong, jungseong, jongseong)
 *
 * @param char - The Character to resolve
 * @returns The resolved string, or null if the jamo cannot form a valid unit
 */
export function resolveCharacter(char: Character): string | null {
  switch (char.kind) {
    case "EMPTY":
      return null;
    case "CHOSEONG_ONLY":
      return char.choseong;
    case "JUNGSEONG_ONLY":
      return char.jungseong;
    case "JONGSEONG_ONLY":
      return char.jongseong;
    case "OPEN_SYLLABLE":
      return composeSyllable(char.choseong, char.jungseong);
    case "FULL_SYLLABLE":
      return composeSyllable(char.choseong, char.jungseong, char.jongseong);
  }
}

/**
 * Type guard that returns true iff resolveCharacter produces a valid Korean
 * syllable block (U+AC00–U+D7A3), narrowing the type to CompleteCharacter.
 * Requires at minimum choseong + jungseong.
 *
 * @param char - The Character to test
 * @returns Whether the character is a complete syllable block
 */
export function isComplete(char: Character): char is CompleteCharacter {
  const resolved = resolveCharacter(char);
  if (resolved === null) return false;
  const cp = resolved.codePointAt(0);
  return cp !== undefined && cp >= 0xac00 && cp <= 0xd7a3;
}
