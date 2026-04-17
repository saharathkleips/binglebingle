/**
 * @file composition.ts
 *
 * Compose and decompose operations for Characters — assembling syllable blocks
 * from jamo and breaking them apart.
 *
 * All functions are pure. No React. No side effects.
 */

import { composeJamo, decomposeJamo, COMBINATION_RULES } from "../jamo/composition";
import { character } from "./index";
import type { Character } from "./index";

// ---------------------------------------------------------------------------
// compose()
// ---------------------------------------------------------------------------

/**
 * Adds an incoming Character to a target Character following Korean syllable
 * construction rules.
 *
 * When target is EMPTY, incoming is returned as-is.
 * At least one of target or incoming must be single-slot — if both are
 * multi-slot, merging would require dropping jamo, which is never permitted.
 * Returns the new Character state, or null if the combination is invalid.
 *
 * @param target - Target Character (the slot being filled)
 * @param incoming - Incoming Character
 * @returns Updated Character, or null if the combination is not permitted
 */
export function compose(target: Character, incoming: Character): Character | null {
  // EMPTY target: absorb incoming as-is (including multi-slot)
  if (target.kind === "EMPTY") return { ...incoming };

  // EMPTY incoming → nothing to add
  if (incoming.kind === "EMPTY") return null;

  switch (target.kind) {
    case "FULL_SYLLABLE": {
      // Only a consonant can extend the jongseong slot (compound/double batchim)
      if (incoming.kind !== "CHOSEONG_ONLY") return null;
      const combined = composeJamo(target.jongseong, incoming.choseong);
      if (combined === null) return null;
      return character({
        choseong: target.choseong,
        jungseong: target.jungseong,
        jongseong: combined,
      });
    }

    case "OPEN_SYLLABLE": {
      if (incoming.kind === "JUNGSEONG_ONLY") {
        const combined = composeJamo(target.jungseong, incoming.jungseong);
        if (combined === null) return null;
        return character({ choseong: target.choseong, jungseong: combined });
      }
      if (incoming.kind === "JONGSEONG_ONLY") {
        return character({
          choseong: target.choseong,
          jungseong: target.jungseong,
          jongseong: incoming.jongseong,
        });
      }
      if (incoming.kind === "CHOSEONG_ONLY") {
        // Incoming consonant fills the jongseong slot; factory rejects ㄸ/ㅃ/ㅉ
        return character({
          choseong: target.choseong,
          jungseong: target.jungseong,
          jongseong: incoming.choseong,
        });
      }
      return null; // both multi-slot
    }

    case "CHOSEONG_ONLY": {
      if (incoming.kind === "CHOSEONG_ONLY") {
        const combined = composeJamo(target.choseong, incoming.choseong);
        if (combined === null) return null;
        return character({ choseong: combined }) ?? character({ jongseong: combined }) ?? null;
      }
      if (incoming.kind === "JUNGSEONG_ONLY") {
        return character({ choseong: target.choseong, jungseong: incoming.jungseong });
      }
      if (incoming.kind === "OPEN_SYLLABLE") {
        // Target consonant slots in as jongseong of the incoming syllable; factory rejects invalid jongseong
        return character({
          choseong: incoming.choseong,
          jungseong: incoming.jungseong,
          jongseong: target.choseong,
        });
      }
      if (incoming.kind === "FULL_SYLLABLE") {
        // Target consonant extends the incoming syllable's jongseong (compound/double batchim)
        const combined = composeJamo(incoming.jongseong, target.choseong);
        if (combined === null) return null;
        return character({
          choseong: incoming.choseong,
          jungseong: incoming.jungseong,
          jongseong: combined,
        });
      }
      return null; // JONGSEONG_ONLY not valid here
    }

    case "JONGSEONG_ONLY": {
      if (incoming.kind === "OPEN_SYLLABLE") {
        // Jongseong slots directly into the incoming syllable (e.g. ㄻ + 사 → 삶)
        return character({
          choseong: incoming.choseong,
          jungseong: incoming.jungseong,
          jongseong: target.jongseong,
        });
      }
      if (incoming.kind === "CHOSEONG_ONLY") {
        // Only meaningful for single-jamo JONGSEONG_ONLY; compound batchim has no composition rules
        const combined = composeJamo(target.jongseong, incoming.choseong);
        if (combined === null) return null;
        return character({ choseong: combined }) ?? character({ jongseong: combined }) ?? null;
      }
      return null;
    }

    case "JUNGSEONG_ONLY": {
      if (incoming.kind === "JUNGSEONG_ONLY") {
        const combined = composeJamo(target.jungseong, incoming.jungseong);
        if (combined === null) return null;
        return character({ jungseong: combined });
      }
      if (incoming.kind === "CHOSEONG_ONLY") {
        // Consonant becomes choseong, vowel stays as jungseong
        return character({ choseong: incoming.choseong, jungseong: target.jungseong });
      }
      return null; // JONGSEONG_ONLY, OPEN_SYLLABLE, FULL_SYLLABLE not valid here
    }
  }
}

// ---------------------------------------------------------------------------
// decompose()
// ---------------------------------------------------------------------------

/**
 * Steps a Character back by one construction level.
 * Returns null when the Character is irreducible (EMPTY or single-jamo);
 * otherwise returns the two constituent Characters.
 *
 * - EMPTY → `null`
 * - CHOSEONG_ONLY, simple → `null`
 * - CHOSEONG_ONLY, double consonant (e.g. ㄲ) → `[cho first, cho second]`
 * - JUNGSEONG_ONLY, simple → `null`
 * - JUNGSEONG_ONLY, complex vowel (e.g. ㅘ) → `[jung base, jung last]`
 * - JONGSEONG_ONLY, simple → `null`
 * - JONGSEONG_ONLY, compound batchim (e.g. ㄳ) → `[cho first, cho second]`
 * - OPEN_SYLLABLE, simple vowel → `[choseong, jungseong]`
 * - OPEN_SYLLABLE, complex vowel → `[open(choseong, base), jung last]`
 * - FULL_SYLLABLE, simple jongseong → `[open(choseong, jungseong), cho jongseong]`
 * - FULL_SYLLABLE, compound jongseong → `[full(choseong, jungseong, first), cho second]`
 *
 * @param char - The Character to decompose
 * @returns A pair of simpler Characters, or null if the Character cannot be decomposed
 */
export function decompose(char: Character): [Character, Character] | null {
  switch (char.kind) {
    case "EMPTY":
      return null;

    case "CHOSEONG_ONLY": {
      const parts = decomposeJamo(char.choseong);
      if (parts !== null) {
        return [character({ choseong: parts[0] })!, character({ choseong: parts[1] })!];
      }
      return null;
    }

    case "JUNGSEONG_ONLY": {
      const parts = decomposeJamo(char.jungseong);
      if (parts !== null) {
        return [character({ jungseong: parts[0] })!, character({ jungseong: parts[1] })!];
      }
      return null;
    }

    case "JONGSEONG_ONLY": {
      const rule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === char.jongseong,
      );
      if (rule !== undefined) {
        const [first, second] = rule.inputs;
        return [character({ choseong: first })!, character({ choseong: second })!];
      }
      return null;
    }

    case "OPEN_SYLLABLE": {
      const parts = decomposeJamo(char.jungseong);
      if (parts !== null) {
        // Complex vowel: choseong stays bound to the base vowel; last-added part peeled off
        return [
          character({ choseong: char.choseong, jungseong: parts[0] })!,
          character({ jungseong: parts[1] })!,
        ];
      }
      return [character({ choseong: char.choseong })!, character({ jungseong: char.jungseong })!];
    }

    case "FULL_SYLLABLE": {
      const compoundRule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === char.jongseong,
      );
      if (compoundRule !== undefined) {
        // Compound batchim: first consonant stays as jongseong, second becomes standalone choseong
        const [first, second] = compoundRule.inputs;
        return [
          character({ choseong: char.choseong, jungseong: char.jungseong, jongseong: first })!,
          character({ choseong: second })!,
        ];
      }
      // Simple jongseong: becomes a standalone choseong (all simple JongseongJamo are valid ChoseongJamo)
      return [
        character({ choseong: char.choseong, jungseong: char.jungseong })!,
        character({ choseong: char.jongseong })!,
      ];
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
  const expanded = characters.flatMap((c) => decompose(c) ?? [c]);
  return expanded.length === characters.length ? expanded : fullDecompose(expanded);
}
