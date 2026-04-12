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
  decomposeJamo,
  COMBINATION_RULES,
} from "../jamo/composition";
import type { ConsonantJamo, VowelJamo, Jamo, ChoseongJamo, JongseongJamo } from "../jamo/jamo";
import { CHOSEONG_INDEX, JONGSEONG_INDEX } from "../jamo/jamo";

export type { ConsonantJamo, VowelJamo, Jamo };

// ---------------------------------------------------------------------------
// Character — discriminated union
// ---------------------------------------------------------------------------

/**
 * A Korean syllable character under construction, represented as a discriminated
 * union over the six valid slot configurations.
 *
 * - `EMPTY`          — nothing placed yet
 * - `CHOSEONG_ONLY`  — single consonant (may be a double consonant like ㄲ)
 * - `JUNGSEONG_ONLY` — single vowel (may be a complex vowel like ㅘ)
 * - `JONGSEONG_ONLY` — standalone final consonant (compound batchim under construction)
 * - `OPEN_SYLLABLE`  — consonant + vowel (e.g. 가); no final consonant yet
 * - `FULL_SYLLABLE`  — consonant + vowel + final consonant (e.g. 한)
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
  | { kind: "OPEN_SYLLABLE"; choseong: ChoseongJamo; jungseong: VowelJamo }
  | {
      kind: "FULL_SYLLABLE";
      choseong: ChoseongJamo;
      jungseong: VowelJamo;
      jongseong: JongseongJamo;
    };

// ---------------------------------------------------------------------------
// character() — factory
// ---------------------------------------------------------------------------

/**
 * Constructs a Character from slot values, deriving the kind automatically.
 * Throws for slot combinations that are structurally invalid (e.g. jungseong +
 * jongseong with no choseong).
 *
 * @param slots - Optional slot values; omit or pass nothing for EMPTY.
 */
export function character(slots?: {
  choseong?: ChoseongJamo;
  jungseong?: VowelJamo;
  jongseong?: JongseongJamo;
}): Character {
  const { choseong, jungseong, jongseong } = slots ?? {};
  if (!choseong && !jungseong && !jongseong) return { kind: "EMPTY" };
  if (choseong && jungseong && jongseong)
    return { kind: "FULL_SYLLABLE", choseong, jungseong, jongseong };
  if (choseong && jungseong) return { kind: "OPEN_SYLLABLE", choseong, jungseong };
  if (choseong) return { kind: "CHOSEONG_ONLY", choseong };
  if (jungseong) return { kind: "JUNGSEONG_ONLY", jungseong };
  if (jongseong) return { kind: "JONGSEONG_ONLY", jongseong };
  throw new Error(`Invalid character slots: ${JSON.stringify(slots)}`);
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
      if (combined === null || !(combined in JONGSEONG_INDEX)) return null;
      return character({
        choseong: target.choseong,
        jungseong: target.jungseong,
        jongseong: combined as JongseongJamo,
      });
    }

    case "OPEN_SYLLABLE": {
      if (incoming.kind === "JUNGSEONG_ONLY") {
        const combined = composeJamo(target.jungseong, incoming.jungseong);
        if (combined === null) return null;
        return character({ choseong: target.choseong, jungseong: combined as VowelJamo });
      }
      if (incoming.kind === "JONGSEONG_ONLY") {
        return character({
          choseong: target.choseong,
          jungseong: target.jungseong,
          jongseong: incoming.jongseong,
        });
      }
      if (incoming.kind === "CHOSEONG_ONLY") {
        // Incoming consonant fills the jongseong slot
        // (ㄸ/ㅃ/ㅉ cannot be jongseong; the game's combination rules prevent this)
        return character({
          choseong: target.choseong,
          jungseong: target.jungseong,
          jongseong: incoming.choseong as JongseongJamo,
        });
      }
      return null; // both multi-slot
    }

    case "CHOSEONG_ONLY": {
      if (incoming.kind === "CHOSEONG_ONLY") {
        const combined = composeJamo(target.choseong, incoming.choseong);
        if (combined === null) return null;
        if (combined in CHOSEONG_INDEX) return character({ choseong: combined as ChoseongJamo });
        if (combined in JONGSEONG_INDEX) return character({ jongseong: combined as JongseongJamo });
        return null;
      }
      if (incoming.kind === "JUNGSEONG_ONLY") {
        return character({ choseong: target.choseong, jungseong: incoming.jungseong });
      }
      if (incoming.kind === "OPEN_SYLLABLE") {
        // Target consonant slots in as jongseong of the incoming syllable
        if (!(target.choseong in JONGSEONG_INDEX)) return null;
        return character({
          choseong: incoming.choseong,
          jungseong: incoming.jungseong,
          jongseong: target.choseong as JongseongJamo,
        });
      }
      if (incoming.kind === "FULL_SYLLABLE") {
        // Target consonant extends the incoming syllable's jongseong (compound/double batchim)
        const combined = composeJamo(incoming.jongseong, target.choseong);
        if (combined === null || !(combined in JONGSEONG_INDEX)) return null;
        return character({
          choseong: incoming.choseong,
          jungseong: incoming.jungseong,
          jongseong: combined as JongseongJamo,
        });
      }
      return null; // JONGSEONG_ONLY not valid here
    }

    case "JONGSEONG_ONLY": {
      // Only a consonant that combines into a valid double choseong is accepted
      if (incoming.kind !== "CHOSEONG_ONLY") return null;
      const combined = composeJamo(target.jongseong, incoming.choseong);
      if (combined !== null && combined in CHOSEONG_INDEX) {
        return character({ choseong: combined as ChoseongJamo });
      }
      return null;
    }

    case "JUNGSEONG_ONLY": {
      if (incoming.kind === "JUNGSEONG_ONLY") {
        const combined = composeJamo(target.jungseong, incoming.jungseong);
        if (combined === null) return null;
        return character({ jungseong: combined as VowelJamo });
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
 * Returns true iff resolveCharacter produces a valid Korean syllable block
 * (U+AC00–U+D7A3). Requires at minimum choseong + jungseong.
 *
 * @param char - The Character to test
 * @returns Whether the character is a complete syllable block
 */
export function isComplete(char: Character): boolean {
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
        return [
          character({ choseong: parts[0] as ChoseongJamo }),
          character({ choseong: parts[1] as ChoseongJamo }),
        ];
      }
      return [char];
    }

    case "JUNGSEONG_ONLY": {
      const parts = decomposeJamo(char.jungseong);
      if (parts !== null) {
        return [
          character({ jungseong: parts[0] as VowelJamo }),
          character({ jungseong: parts[1] as VowelJamo }),
        ];
      }
      return [char];
    }

    case "JONGSEONG_ONLY": {
      const rule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === char.jongseong,
      );
      if (rule !== undefined) {
        const [first, second] = rule.inputs;
        return [
          character({ choseong: first as ChoseongJamo }),
          character({ choseong: second as ChoseongJamo }),
        ];
      }
      return [char];
    }

    case "OPEN_SYLLABLE": {
      const parts = decomposeJamo(char.jungseong);
      if (parts !== null) {
        // Complex vowel: choseong stays bound to the base vowel; last-added part peeled off
        return [
          character({ choseong: char.choseong, jungseong: parts[0] as VowelJamo }),
          character({ jungseong: parts[1] as VowelJamo }),
        ];
      }
      return [character({ choseong: char.choseong }), character({ jungseong: char.jungseong })];
    }

    case "FULL_SYLLABLE": {
      const compoundRule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === char.jongseong,
      );
      if (compoundRule !== undefined) {
        // Compound batchim: first consonant stays as jongseong, second becomes standalone choseong
        const [first, second] = compoundRule.inputs;
        return [
          character({
            choseong: char.choseong,
            jungseong: char.jungseong,
            jongseong: first as JongseongJamo,
          }),
          character({ choseong: second as ChoseongJamo }),
        ];
      }
      // Simple jongseong: becomes a standalone choseong (all simple JongseongJamo are valid ChoseongJamo)
      return [
        character({ choseong: char.choseong, jungseong: char.jungseong }),
        character({ choseong: char.jongseong as ChoseongJamo }),
      ];
    }
  }
}
