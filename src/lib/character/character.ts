/**
 * @file character.ts
 *
 * Character assembly functions — the bridge between raw jamo operations and
 * the game's character model.
 *
 * All functions are pure. No React. No side effects.
 * Unicode note: syllable blocks range U+AC00–U+D7A3.
 */

import {
  composeJamo,
  composeSyllable,
  decomposeSyllable,
  decomposeJamo,
  COMBINATION_RULES,
} from "../jamo/composition";
import type { VowelJamo, Jamo, ChoseongJamo, JongseongJamo } from "../jamo/jamo";
import { CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX } from "../jamo/jamo";
import { getRotationBase } from "../jamo/rotation";

// ---------------------------------------------------------------------------
// Character — discriminated union
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// character() — factory
// ---------------------------------------------------------------------------

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
    const { choseong, jungseong, jongseong } = decomposed;
    const char = character({ choseong, jungseong, ...(jongseong !== null ? { jongseong } : {}) });
    if (char === null || !isComplete(char)) return null;
    return char;
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
// resolveCharacter()
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// isComplete()
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// decompose()
// ---------------------------------------------------------------------------

/**
 * Steps a Character back by one construction level. Never loses a jamo —
 * a single-jamo Character always returns a single-element array.
 * At most two Characters are returned per call.
 *
 * - EMPTY → `[]`
 * - CHOSEONG_ONLY, simple → `[itself]`
 * - CHOSEONG_ONLY, double consonant (e.g. ㄲ) → `[cho first, cho second]`
 * - JUNGSEONG_ONLY, simple → `[itself]`
 * - JUNGSEONG_ONLY, complex vowel (e.g. ㅘ) → `[jung base, jung last]`
 * - JONGSEONG_ONLY, simple → `[itself]`
 * - JONGSEONG_ONLY, compound batchim (e.g. ㄳ) → `[cho first, cho second]`
 * - OPEN_SYLLABLE, simple vowel → `[choseong, jungseong]`
 * - OPEN_SYLLABLE, complex vowel → `[open(choseong, base), jung last]`
 * - FULL_SYLLABLE, simple jongseong → `[open(choseong, jungseong), cho jongseong]`
 * - FULL_SYLLABLE, compound jongseong → `[full(choseong, jungseong, first), cho second]`
 *
 * @param char - The Character to decompose
 * @returns Array of simpler Characters (empty only for EMPTY)
 */
export function decompose(char: Character): Character[] {
  switch (char.kind) {
    case "EMPTY":
      return [];

    case "CHOSEONG_ONLY": {
      const parts = decomposeJamo(char.choseong);
      if (parts !== null) {
        return [character({ choseong: parts[0] })!, character({ choseong: parts[1] })!];
      }
      return [char];
    }

    case "JUNGSEONG_ONLY": {
      const parts = decomposeJamo(char.jungseong);
      if (parts !== null) {
        return [character({ jungseong: parts[0] })!, character({ jungseong: parts[1] })!];
      }
      return [char];
    }

    case "JONGSEONG_ONLY": {
      const rule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === char.jongseong,
      );
      if (rule !== undefined) {
        const [first, second] = rule.inputs;
        return [character({ choseong: first })!, character({ choseong: second })!];
      }
      return [char];
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

// ---------------------------------------------------------------------------
// normalizeCharacter()
// ---------------------------------------------------------------------------

/**
 * Rotates a single-jamo Character to the canonical (0-index) member of its
 * rotation set. Non-rotatable or multi-jamo Characters are returned unchanged.
 * Call this on each element of a derived pool to prevent the pool from
 * revealing which target jamo are rotated.
 *
 * @param char - A single-jamo Character (output of `decompose` until irreducible)
 * @returns The Character with its jamo rotated to its rotation base, or unchanged
 */
export function normalizeCharacter(char: Character): Character {
  switch (char.kind) {
    case "CHOSEONG_ONLY": {
      const base = getRotationBase(char.choseong);
      return character({ choseong: base }) ?? char;
    }
    case "JUNGSEONG_ONLY": {
      const base = getRotationBase(char.jungseong as Jamo);
      return character({ jungseong: base }) ?? char;
    }
    case "JONGSEONG_ONLY": {
      const base = getRotationBase(char.jongseong as Jamo);
      return character({ jongseong: base }) ?? char;
    }
    default:
      return char;
  }
}
