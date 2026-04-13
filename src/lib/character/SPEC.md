# SPEC: Character

**Status:** stable
**Slice:** `src/lib/character/`

## Purpose

`Character` is the central player-facing abstraction. It represents an ordered list of jamo that the player is assembling — it may be complete (a valid syllable block) or incomplete (partial or intermediate).

**Boundaries:**
- In: `Character` values (jamo arrays)
- Out: resolved string or null, boolean completion status
- Calls into: `src/lib/jamo/` for combination and composition
- No knowledge of: game state, pool, UI, React

## File Map

```
src/lib/character/
├── character.ts        # Character type, resolveCharacter(), isComplete()
└── character.test.ts
```

## Types

```typescript
// character.ts
export type Character = {
  jamo: readonly string[];
};
```

A Character's jamo list is always length 1, 2, or 3 — never longer. Combinations always collapse to a single jamo immediately, so multi-jamo state only occurs during syllable composition (choseong + jungseong + optional jongseong).

## Resolution Logic

`resolveCharacter` reduces the jamo list to its simplest form:

| jamo length | behaviour |
|-------------|-----------|
| 0 | `null` |
| 1 | returns the jamo as-is (may be a combined jamo like ㅐ or compound batchim like ㄳ) |
| 2 | tries `combineJamo` first, then `composeSyllable`; `null` if neither applies |
| 3 | tries `composeSyllable(jamo[0], jamo[1], jamo[2])`; `null` if invalid |

`isComplete` returns true only when `resolveCharacter` produces a syllable block in U+AC00–U+D7A3. A bare jamo (`'ㄱ'`) or combined jamo (`'ㅐ'`) is not complete.

## Key Decisions

**C1 — Combination takes precedence over syllable composition at length 2.** `['ㅏ','ㅣ']` resolves to `'ㅐ'` via combine, not attempted as a (invalid) syllable.

**C2 — `['ㅐ']` resolves to `'ㅐ'`, `isComplete` is false.** A single already-combined jamo is a valid intermediate state. The player can use it as a jungseong in a larger syllable.

**C3 — `['ㄳ']` is a valid single-jamo Character.** Compound batchim are produced by `upgradeJongseong` and stored as a collapsed single jamo in the Character, not as two separate jamo.
