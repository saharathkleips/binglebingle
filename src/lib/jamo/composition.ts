/**
 * @file composition.ts
 *
 * Combination data, jamo combination, and syllable composition/decomposition functions.
 * Implements the core "combine" and "compose" mechanics used throughout the game.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: all jamo use Hangul Compatibility Jamo (U+3130–U+318F).
 */

import {
  CHOSEONG_BY_INDEX,
  CHOSEONG_INDEX,
  JONGSEONG_BY_INDEX,
  JONGSEONG_INDEX,
  JUNGSEONG_BY_INDEX,
  JUNGSEONG_INDEX,
  type ChoseongJamo,
  type JongseongJamo,
  type VowelJamo,
} from "./jamo";
import type { Jamo } from "./jamo";

// ---------------------------------------------------------------------------
// Syllable base codepoint (UAX #15)
// ---------------------------------------------------------------------------

const SYLLABLE_BASE = 0xac00;

// ---------------------------------------------------------------------------
// Combination data
// ---------------------------------------------------------------------------

/**
 * A rule that combines two jamo into a double consonant, complex vowel, or compound batchim.
 *
 * @property inputs - The two input jamo; order matches display order.
 * @property output - The resulting combined jamo.
 * @property kind - Whether this produces a double consonant, complex vowel, or compound batchim.
 * @property alternate - True for non-canonical input paths that produce the same output as another
 *   rule. Alternate rules are used for composition but excluded from decomposition, so outputs with
 *   multiple input paths always decompose via their canonical path.
 */
export type CombinationRule = {
  readonly inputs: readonly [Jamo, Jamo];
  readonly output: Jamo;
  readonly kind: "DOUBLE_CONSONANT" | "COMPLEX_VOWEL" | "COMPOUND_BATCHIM";
  readonly alternate?: true;
};

/**
 * All combination rules: double consonants (5), complex vowels (13), and
 * compound batchim (11). 29 entries total (including 2 alternate-input rules).
 *
 * DOUBLE_CONSONANT and COMPLEX_VOWEL rules are commutative. COMPOUND_BATCHIM
 * rules are not — canonical input order only (e.g. ㄱ+ㅅ→ㄳ; ㅅ+ㄱ has no rule).
 *
 * ㅙ and ㅞ each have two input paths. The non-canonical paths are marked
 * `alternate: true`; decomposition always returns the canonical path.
 */
export const COMBINATION_RULES: readonly CombinationRule[] = [
  // Double consonants (5)
  { inputs: ["ㄱ", "ㄱ"], output: "ㄲ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㄷ", "ㄷ"], output: "ㄸ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㅂ", "ㅂ"], output: "ㅃ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㅅ", "ㅅ"], output: "ㅆ", kind: "DOUBLE_CONSONANT" },
  { inputs: ["ㅈ", "ㅈ"], output: "ㅉ", kind: "DOUBLE_CONSONANT" },

  // Complex vowels (11 canonical + 2 alternate = 13 total)
  { inputs: ["ㅏ", "ㅣ"], output: "ㅐ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅑ", "ㅣ"], output: "ㅒ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅓ", "ㅣ"], output: "ㅔ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅕ", "ㅣ"], output: "ㅖ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅗ", "ㅏ"], output: "ㅘ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅗ", "ㅐ"], output: "ㅙ", kind: "COMPLEX_VOWEL", alternate: true }, // alternate compose path
  { inputs: ["ㅘ", "ㅣ"], output: "ㅙ", kind: "COMPLEX_VOWEL" }, // canonical decompose path
  { inputs: ["ㅗ", "ㅣ"], output: "ㅚ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅜ", "ㅓ"], output: "ㅝ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅜ", "ㅔ"], output: "ㅞ", kind: "COMPLEX_VOWEL", alternate: true }, // alternate compose path
  { inputs: ["ㅝ", "ㅣ"], output: "ㅞ", kind: "COMPLEX_VOWEL" }, // canonical decompose path
  { inputs: ["ㅜ", "ㅣ"], output: "ㅟ", kind: "COMPLEX_VOWEL" },
  { inputs: ["ㅡ", "ㅣ"], output: "ㅢ", kind: "COMPLEX_VOWEL" },

  // Compound batchim (11)
  { inputs: ["ㄱ", "ㅅ"], output: "ㄳ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄴ", "ㅈ"], output: "ㄵ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄴ", "ㅎ"], output: "ㄶ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㄱ"], output: "ㄺ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅁ"], output: "ㄻ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅂ"], output: "ㄼ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅅ"], output: "ㄽ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅌ"], output: "ㄾ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅍ"], output: "ㄿ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㄹ", "ㅎ"], output: "ㅀ", kind: "COMPOUND_BATCHIM" },
  { inputs: ["ㅂ", "ㅅ"], output: "ㅄ", kind: "COMPOUND_BATCHIM" },
];

/**
 * Unified lookup map for all three kinds of jamo combination.
 * - DOUBLE_CONSONANT (5 rules): stores both a|b and b|a keys (same key since a===b)
 * - COMPLEX_VOWEL (13 rules): stores both a|b and b|a keys for commutativity
 * - COMPOUND_BATCHIM (11 rules): stores only canonical a|b key (not commutative)
 *
 * Total: 5 + 26 + 11 = 42 entries (13 rules × 2 = 26; all 13 complex vowel rules, including
 * the 2 alternate-input rules, are commutative).
 * Keys are `"${a}|${b}"` strings. Built once at module load.
 * @internal
 */
const COMBINATION_MAP: ReadonlyMap<string, Jamo> = new Map(
  COMBINATION_RULES.flatMap((rule) => {
    const [a, b] = rule.inputs;
    const fwd: [string, Jamo] = [`${a}|${b}`, rule.output];
    if ((rule.kind === "DOUBLE_CONSONANT" || rule.kind === "COMPLEX_VOWEL") && a !== b) {
      return [fwd, [`${b}|${a}`, rule.output]];
    }
    return [fwd];
  }),
);

/**
 * Reverse lookup map: combination output → [input0, input1] using canonical order.
 * Alternate-input rules (alternate: true) are excluded so that outputs with multiple
 * input paths (ㅙ, ㅞ) always decompose via their canonical path.
 * Built once at module load.
 * @internal
 */
const DECOMPOSE_MAP: ReadonlyMap<Jamo, readonly [Jamo, Jamo]> = new Map(
  COMBINATION_RULES.filter((rule) => !rule.alternate).map((rule) => [rule.output, rule.inputs]),
);

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Combines two jamo into the double consonant, complex vowel, or compound batchim
 * produced by their combination. Returns null if no rule exists.
 *
 * Commutative for DOUBLE_CONSONANT and COMPLEX_VOWEL.
 * Compound batchim require canonical argument order (e.g. ㄱ+ㅅ→ㄳ; ㅅ+ㄱ→null).
 *
 * @param a - First Hangul Compatibility Jamo
 * @param b - Second Hangul Compatibility Jamo
 * @returns The combined jamo, or null if no combination rule exists
 */
export function composeJamo(a: Jamo, b: Jamo): Jamo | null {
  return COMBINATION_MAP.get(`${a}|${b}`) ?? null;
}

/**
 * Decomposes a combined jamo into the two inputs that produce it.
 * Returns null if the jamo is not a combination result.
 *
 * @param jamo - A Hangul Compatibility Jamo that may be a combination result
 * @returns [input0, input1] in canonical order, or null if not a combination result
 */
export function decomposeJamo(jamo: Jamo): readonly [Jamo, Jamo] | null {
  return DECOMPOSE_MAP.get(jamo) ?? null;
}

/**
 * Composes a Korean syllable block from choseong, jungseong, and optional jongseong.
 * Returns null if any component is not valid for its position.
 *
 * @param choseong - Initial consonant (Hangul Compatibility Jamo)
 * @param jungseong - Vowel (Hangul Compatibility Jamo)
 * @param jongseong - Optional final consonant (Hangul Compatibility Jamo)
 * @returns The composed syllable block character, or null if inputs are invalid
 */
export function composeSyllable(
  choseong: ChoseongJamo,
  jungseong: VowelJamo,
  jongseong?: JongseongJamo,
): string | null {
  const cho = CHOSEONG_INDEX[choseong];
  const jung = JUNGSEONG_INDEX[jungseong];
  const jong = JONGSEONG_INDEX[jongseong ?? ""];

  if (cho === undefined || jung === undefined || jong === undefined) return null;

  const codepoint = SYLLABLE_BASE + (cho * 21 + jung) * 28 + jong;
  return String.fromCodePoint(codepoint);
}

/**
 * Decomposes a Korean syllable block into its choseong, jungseong, and jongseong
 * components. Returns null if the input is not a syllable block (U+AC00–U+D7A3).
 *
 * All returned jamo use Hangul Compatibility Jamo codepoints (U+3130–U+318F).
 *
 * @param syllable - A single Korean syllable block character
 * @returns The decomposed jamo components, or null if input is not a syllable block
 */
export function decomposeSyllable(
  syllable: string,
): { choseong: ChoseongJamo; jungseong: VowelJamo; jongseong?: JongseongJamo } | null {
  const cp = syllable.codePointAt(0);
  if (cp === undefined || cp < 0xac00 || cp > 0xd7a3) return null;

  const offset = cp - SYLLABLE_BASE;
  const jongIdx = offset % 28;
  const jungIdx = Math.floor(offset / 28) % 21;
  const choIdx = Math.floor(offset / 28 / 21);

  const choseong = CHOSEONG_BY_INDEX[choIdx];
  const jungseong = JUNGSEONG_BY_INDEX[jungIdx];
  // jongIdx === 0 means no final consonant
  const jongseong: JongseongJamo | undefined =
    jongIdx === 0 ? undefined : JONGSEONG_BY_INDEX[jongIdx] || undefined;

  if (choseong === undefined || jungseong === undefined) return null;

  return { choseong, jungseong, ...(jongseong !== undefined ? { jongseong } : {}) };
}
