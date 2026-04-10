/**
 * @file character.ts
 *
 * Character assembly functions — the bridge between raw jamo operations and
 * the game's character model.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import { composeJamo, composeSyllable, COMBINATION_RULES } from "../jamo/composition";
import type { ConsonantJamo, VowelJamo, Jamo, ChoseongJamo, JongseongJamo } from "../jamo/jamo";
import { CHOSEONG_INDEX, JONGSEONG_INDEX } from "../jamo/jamo";

export type { ConsonantJamo, VowelJamo, Jamo };

/**
 * A Korean syllable character under construction.
 *
 * Each slot holds a single jamo token. Combinations collapse immediately —
 * e.g. two consonants become one double consonant before being stored.
 *
 * - `{}` — empty slot (nothing placed yet)
 * - `{ choseong }` — single consonant (may be a double consonant like ㄲ)
 * - `{ jungseong }` — single vowel (may be a complex vowel like ㅘ)
 * - `{ choseong, jungseong }` — open syllable or partial block
 * - `{ choseong, jungseong, jongseong }` — closed syllable block
 *
 * Use `compose(a, b)` to add jamo to a Character in a state-machine fashion.
 * Use `resolveCharacter(char)` to render the Character as a Unicode string.
 */
export type Character = {
  choseong?: ChoseongJamo;
  jungseong?: VowelJamo;
  jongseong?: JongseongJamo;
};

// ---------------------------------------------------------------------------
// compose()
// ---------------------------------------------------------------------------

/**
 * Adds an incoming single-slot Character to a target Character following Korean
 * syllable construction rules.
 *
 * The incoming Character must have exactly one slot set (choseong or jungseong).
 * Returns the new Character state, or null if the combination is invalid.
 *
 * @param target - Target Character (the slot being filled)
 * @param incoming - Incoming Character (always single-slot: one of choseong or jungseong)
 * @returns Updated Character, or null if the combination is not permitted
 */
export function compose(target: Character, incoming: Character): Character | null {
  // -------------------------------------------------------------------------
  // Empty target
  // -------------------------------------------------------------------------
  if (target.choseong === undefined && target.jungseong === undefined && target.jongseong === undefined) {
    if (incoming.choseong !== undefined) return { choseong: incoming.choseong };
    if (incoming.jungseong !== undefined) return { jungseong: incoming.jungseong };
    if (incoming.jongseong !== undefined) return { jongseong: incoming.jongseong };
    return null;
  }

  // -------------------------------------------------------------------------
  // Full target (choseong + jungseong + jongseong)
  // -------------------------------------------------------------------------
  if (target.choseong !== undefined && target.jungseong !== undefined && target.jongseong !== undefined) {
    if (incoming.choseong !== undefined) {
      // Attempt jongseong upgrade via any combination rule (compound batchim or double consonant).
      // Only accept the result if it is a valid jongseong (ㄸ/ㅃ/ㅉ are not).
      const combined = composeJamo(target.jongseong, incoming.choseong);
      if (combined === null || !(combined in JONGSEONG_INDEX)) return null;
      return { choseong: target.choseong, jungseong: target.jungseong, jongseong: combined as JongseongJamo };
    }
    // Full + jungseong or anything else → invalid
    return null;
  }

  // -------------------------------------------------------------------------
  // Choseong + jungseong target (no jongseong yet)
  // -------------------------------------------------------------------------
  if (target.choseong !== undefined && target.jungseong !== undefined) {
    if (incoming.jungseong !== undefined) {
      // Try to combine the two vowels
      const combined = composeJamo(target.jungseong, incoming.jungseong);
      if (combined === null) return null;
      return { choseong: target.choseong, jungseong: combined as VowelJamo };
    }
    if (incoming.jongseong !== undefined) {
      // Incoming jongseong fills the final consonant slot directly
      return { choseong: target.choseong, jungseong: target.jungseong, jongseong: incoming.jongseong };
    }
    if (incoming.choseong !== undefined) {
      // Incoming consonant becomes jongseong — ChoseongJamo is a subset of JongseongJamo
      // (all basic consonants and ㄲ, ㄶ are valid jongseong, but ㄸ/ㅃ/ㅉ are not)
      // incoming.choseong is ChoseongJamo; cast to JongseongJamo is valid for basic consonants,
      // but ㄸ/ㅃ/ㅉ cannot be jongseong. The game's combination rules prevent this.
      return { choseong: target.choseong, jungseong: target.jungseong, jongseong: incoming.choseong as JongseongJamo };
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Choseong-only target
  // -------------------------------------------------------------------------
  if (target.choseong !== undefined && target.jungseong === undefined) {
    if (incoming.choseong !== undefined) {
      // Try to combine two consonants. If the result is a valid choseong (double consonant),
      // keep it as choseong. If it is only valid as jongseong (compound batchim), return
      // jongseong-only state.
      const combined = composeJamo(target.choseong, incoming.choseong);
      if (combined === null) return null;
      if (combined in CHOSEONG_INDEX) return { choseong: combined as ChoseongJamo };
      if (combined in JONGSEONG_INDEX) return { jongseong: combined as JongseongJamo };
      return null;
    }
    if (incoming.jungseong !== undefined) {
      // Consonant + vowel → open syllable
      return { choseong: target.choseong, jungseong: incoming.jungseong };
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Jongseong-only target
  // -------------------------------------------------------------------------
  if (target.jongseong !== undefined && target.choseong === undefined && target.jungseong === undefined) {
    if (incoming.choseong !== undefined) {
      // Try to combine jongseong + incoming consonant into a valid choseong (double consonant).
      const combined = composeJamo(target.jongseong, incoming.choseong);
      if (combined !== null && combined in CHOSEONG_INDEX) {
        return { choseong: combined as ChoseongJamo };
      }
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Jungseong-only target
  // -------------------------------------------------------------------------
  if (target.jungseong !== undefined && target.choseong === undefined) {
    if (incoming.jungseong !== undefined) {
      // Try to combine two vowels into a complex vowel
      const combined = composeJamo(target.jungseong, incoming.jungseong);
      if (combined === null) return null;
      return { jungseong: combined as VowelJamo };
    }
    if (incoming.choseong !== undefined) {
      // Incoming consonant becomes choseong (consonant-becomes-choseong rule)
      return { choseong: incoming.choseong, jungseong: target.jungseong };
    }
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// resolveCharacter()
// ---------------------------------------------------------------------------

/**
 * Reduces a Character to its rendered Unicode string form.
 *
 * - No choseong AND no jungseong → null (empty)
 * - Jungseong without choseong renders as bare vowel.
 * - Jongseong without choseong and jungseong is an invalid state that returns null
 *   (jongseong is only valid when choseong+jungseong are present).
 * - Strictly unrenderable: { jungseong, jongseong } with no choseong → null.
 * - Choseong only → return choseong string (bare consonant)
 * - Choseong + jungseong [+ optional jongseong] → composeSyllable(...)
 *
 * @param character - The Character to resolve
 * @returns The resolved string, or null if the jamo cannot form a valid unit
 */
export function resolveCharacter(character: Character): string | null {
  const { choseong, jungseong, jongseong } = character;

  if (choseong === undefined && jungseong === undefined) {
    // Jongseong-only state renders as the bare consonant character (e.g. compound batchim under construction)
    if (jongseong !== undefined) return jongseong;
    return null;
  }

  // { jungseong, jongseong } with no choseong is unrenderable — jongseong requires a full syllable
  if (jungseong !== undefined && choseong === undefined && jongseong !== undefined) return null;

  if (choseong !== undefined && jungseong === undefined) return choseong;
  if (jungseong !== undefined && choseong === undefined) return jungseong;

  // Both choseong and jungseong are set
  if (choseong !== undefined && jungseong !== undefined) {
    return composeSyllable(choseong, jungseong, jongseong);
  }

  return null;
}

// ---------------------------------------------------------------------------
// isComplete()
// ---------------------------------------------------------------------------

/**
 * Returns true iff resolveCharacter produces a valid Korean syllable block
 * (U+AC00–U+D7A3). Requires at minimum choseong + jungseong.
 *
 * @param character - The Character to test
 * @returns Whether the character is a complete syllable block
 */
export function isComplete(character: Character): boolean {
  const resolved = resolveCharacter(character);
  if (resolved === null) return false;
  const cp = resolved.codePointAt(0);
  return cp !== undefined && cp >= 0xac00 && cp <= 0xd7a3;
}

// ---------------------------------------------------------------------------
// decompose()
// ---------------------------------------------------------------------------

/**
 * Steps a Character back by one construction level, splitting compound batchim
 * jongseong into its two constituent consonants when present.
 *
 * - Full syllable (choseong+jungseong+jongseong):
 *   - If jongseong is compound batchim: returns [{ choseong, jungseong }, { choseong: first }, { choseong: second }]
 *   - If jongseong is simple: returns [{ choseong, jungseong }]
 * - Choseong + jungseong → [{ choseong }]
 * - Choseong only → []
 * - Empty → []
 *
 * @param char - The Character to decompose
 * @returns Array of simpler Characters (may be empty)
 */
export function decompose(char: Character): Character[] {
  const { choseong, jungseong, jongseong } = char;

  // Nothing to decompose
  if (choseong === undefined && jungseong === undefined) return [];
  if (choseong !== undefined && jungseong === undefined) return [];

  // Choseong + jungseong (+ optional jongseong)
  if (choseong !== undefined && jungseong !== undefined) {
    if (jongseong !== undefined) {
      // Check if jongseong is a compound batchim (not DOUBLE_CONSONANT — ㄲ/ㅆ stay intact)
      const rule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === jongseong,
      );
      if (rule !== undefined) {
        const [first, second] = rule.inputs;
        // first and second are consonants (ConsonantJamo) — cast to ChoseongJamo for Character
        return [
          { choseong, jungseong },
          { choseong: first as ChoseongJamo },
          { choseong: second as ChoseongJamo },
        ];
      }
      // Simple jongseong — return it as a standalone choseong so no tile is lost.
      // Basic consonants and ㄲ/ㅆ (the only non-compound JongseongJamo) are all valid ChoseongJamo.
      return [{ choseong, jungseong }, { choseong: jongseong as ChoseongJamo }];
    }
    // No jongseong — remove jungseong
    return [{ choseong }];
  }

  // Jungseong-only (unusual but handle gracefully)
  if (jungseong !== undefined && choseong === undefined) return [];

  return [];
}
