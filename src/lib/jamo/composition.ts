/**
 * @file composition.ts
 *
 * Jamo combination and syllable composition/decomposition functions.
 * Implements the core "combine" and "compose" mechanics used throughout the game.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: all jamo use Hangul Compatibility Jamo (U+3130–U+318F).
 */

import {
  CHOSEONG_BY_INDEX,
  CHOSEONG_INDEX,
  COMBINATION_MAP,
  JONGSEONG_BY_INDEX,
  JONGSEONG_INDEX,
  JONGSEONG_UPGRADE_MAP,
  JUNGSEONG_BY_INDEX,
  JUNGSEONG_INDEX,
} from "./jamo-data";

// ---------------------------------------------------------------------------
// Syllable base codepoint (UAX #15)
// ---------------------------------------------------------------------------

const SYLLABLE_BASE = 0xac00;

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Combines two jamo into a double consonant or complex vowel, if a combination
 * rule exists. Commutative — argument order does not affect the result.
 *
 * Does NOT handle compound batchim (e.g. ㄱ+ㅅ → ㄳ). Use upgradeJongseong for that.
 *
 * @param a - First Hangul Compatibility Jamo string
 * @param b - Second Hangul Compatibility Jamo string
 * @returns The combined jamo, or null if no combination rule exists
 */
export function combineJamo(a: string, b: string): string | null {
  const key = [a, b].sort().join("|");
  const rule = COMBINATION_MAP.get(key);
  return rule?.output ?? null;
}

/**
 * Upgrades a single jongseong consonant to a compound batchim by adding an
 * additional consonant. Not commutative — argument order matters.
 *
 * Use this when adding a consonant to a Character that already has choseong +
 * jungseong + single jongseong.
 *
 * @param existingJongseong - The consonant already in the jongseong position
 * @param additional - The consonant being added
 * @returns The compound batchim jongseong, or null if no upgrade rule exists
 */
export function upgradeJongseong(existingJongseong: string, additional: string): string | null {
  const key = `${existingJongseong}|${additional}`;
  return JONGSEONG_UPGRADE_MAP.get(key) ?? null;
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
  choseong: string,
  jungseong: string,
  jongseong?: string,
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
): { choseong: string; jungseong: string; jongseong: string | null } | null {
  const cp = syllable.codePointAt(0);
  if (cp === undefined || cp < 0xac00 || cp > 0xd7a3) return null;

  const offset = cp - SYLLABLE_BASE;
  const jongIdx = offset % 28;
  const jungIdx = Math.floor(offset / 28) % 21;
  const choIdx = Math.floor(offset / 28 / 21);

  const choseong = CHOSEONG_BY_INDEX[choIdx];
  const jungseong = JUNGSEONG_BY_INDEX[jungIdx];
  // jongIdx === 0 means no final consonant
  const jongseong = jongIdx === 0 ? null : (JONGSEONG_BY_INDEX[jongIdx] ?? null);

  // choseong and jungseong must always resolve for a valid syllable block — guard for TypeScript
  if (choseong === undefined || jungseong === undefined) return null;

  return { choseong, jungseong, jongseong };
}
