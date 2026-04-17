# SPEC: character

**Status:** stable

## Purpose

`Character` is the central player-facing abstraction. It represents a Korean syllable under construction, keyed by slot (choseong / jungseong / jongseong) rather than a flat jamo list. This module encodes Korean syllable construction rules and is the primary interface the game state reducer works through.

**Boundaries:**

- In: `Character` values, `Jamo` strings
- Out: resolved string or null, boolean completion status, decomposed Characters
- Calls into: `src/lib/jamo/` for combination and syllable composition
- No knowledge of: game state, pool, UI, React

## File Map

```
character/
├── index.ts            # Character type, CompleteCharacter, character(), resolveCharacter(), isComplete()
├── index.test.ts
├── composition.ts      # compose(), decompose(), fullDecompose()
├── composition.test.ts
├── rotation.ts         # normalizeCharacter(), getNextRotation()
└── rotation.test.ts
```

## Types

```typescript
// character.ts

export type CompleteCharacter =
  | { kind: "OPEN_SYLLABLE"; choseong: ChoseongJamo; jungseong: VowelJamo }
  | {
      kind: "FULL_SYLLABLE";
      choseong: ChoseongJamo;
      jungseong: VowelJamo;
      jongseong: JongseongJamo;
    };

export type Character =
  | { kind: "EMPTY" }
  | { kind: "CHOSEONG_ONLY"; choseong: ChoseongJamo }
  | { kind: "JUNGSEONG_ONLY"; jungseong: VowelJamo }
  | { kind: "JONGSEONG_ONLY"; jongseong: JongseongJamo }
  | CompleteCharacter;
```

Use `character(input?)` to construct. The factory returns `null` for invalid combinations (e.g. ㄸ/ㅃ/ㅉ as jongseong; jungseong + jongseong without choseong).

## Functions

### character(input?) => Character | null

Overloaded factory: when called with a syllable string (U+AC00–U+D7A3) it parses the block and returns `CompleteCharacter | null`; when called with optional slot values `{ choseong?, jungseong?, jongseong? }` it derives the kind automatically and returns `Character | null`. Returns `null` for any structurally invalid combination.

```typescript
function character(syllable: string): CompleteCharacter | null;
function character(slots?: {
  choseong?: Jamo;
  jungseong?: Jamo;
  jongseong?: Jamo;
}): Character | null;
```

**ㄸ/ㅃ/ㅉ are rejected as jongseong.** These double consonants are only valid as choseong. The factory delegates to `JONGSEONG_INDEX` membership check — callers never need to guard separately.

### compose(target, incoming) => Character | null

```typescript
function compose(target: Character, incoming: Character): Character | null;
```

Merges `incoming` into `target` following syllable construction rules. Returns `null` if the merge is not permitted. At least one of `target` or `incoming` must be single-slot — if both are multi-slot, merging would require dropping jamo, which is never permitted.

- EMPTY target: absorbs incoming as-is (even multi-slot)
- EMPTY incoming: always `null`
- CHOSEONG_ONLY + CHOSEONG_ONLY: `composeJamo` (double consonant or compound batchim result)
- CHOSEONG_ONLY + JUNGSEONG_ONLY: becomes OPEN_SYLLABLE
- OPEN_SYLLABLE + JUNGSEONG_ONLY: `composeJamo` on the jungseong (complex vowel)
- OPEN_SYLLABLE + CHOSEONG_ONLY: consonant fills jongseong slot (factory rejects ㄸ/ㅃ/ㅉ)
- FULL_SYLLABLE + CHOSEONG_ONLY: `composeJamo` on jongseong (compound batchim)
- Multi-slot + multi-slot (both have 2+ jamo): `null` — would require dropping jamo

Commutativity is also supported when the incoming is a larger unit: e.g. `CHOSEONG_ONLY` target + `OPEN_SYLLABLE` incoming routes the consonant into the incoming syllable's jongseong slot.

### resolveCharacter(char) => string | null

```typescript
function resolveCharacter(char: Character): string | null;
```

Renders a Character as its Unicode string. Returns `null` only for `EMPTY`.

| kind           | output                                            |
| -------------- | ------------------------------------------------- |
| EMPTY          | `null`                                            |
| CHOSEONG_ONLY  | bare consonant string                             |
| JUNGSEONG_ONLY | bare vowel string                                 |
| JONGSEONG_ONLY | bare consonant string (compound batchim)          |
| OPEN_SYLLABLE  | `composeSyllable(choseong, jungseong)`            |
| FULL_SYLLABLE  | `composeSyllable(choseong, jungseong, jongseong)` |

### isComplete(char) => char is CompleteCharacter

```typescript
function isComplete(char: Character): char is CompleteCharacter;
```

Type guard that returns `true` iff `resolveCharacter` produces a value in U+AC00–U+D7A3, narrowing to `CompleteCharacter`. Requires at minimum `choseong` + `jungseong`. ㅇ is treated as a regular consonant with no special handling.

**The check is done via resolved codepoint, not via kind.** Only OPEN_SYLLABLE and FULL_SYLLABLE produce syllable block values, but the codepoint check avoids coupling to the union shape.

### decompose(char) => [Character, Character] | null

```typescript
function decompose(char: Character): [Character, Character] | null;
```

Steps a Character back by one construction level — never drops a jamo. Returns `null` for irreducible Characters (EMPTY or single-jamo); otherwise returns the two constituent Characters.

- EMPTY → `null`
- CHOSEONG_ONLY (simple) → `null`
- CHOSEONG_ONLY (double consonant, e.g. ㄲ) → `[cho first, cho second]`
- JUNGSEONG_ONLY (simple) → `null`
- JUNGSEONG_ONLY (complex vowel, e.g. ㅘ) → `[jung base, jung last]`
- JONGSEONG_ONLY (simple) → `null`
- JONGSEONG_ONLY (compound batchim, e.g. ㄳ) → `[cho first, cho second]`
- OPEN_SYLLABLE (simple vowel) → `[choseong, jungseong]`
- OPEN_SYLLABLE (complex vowel) → `[open(choseong, base), jungseong last]`
- FULL_SYLLABLE (simple jongseong) → `[open(choseong, jungseong), cho jongseong]`
- FULL_SYLLABLE (compound jongseong) → `[full(choseong, jungseong, first), cho second]`

**Returns `[Character, Character] | null` rather than `Character[]`.** The previous `Character[]` return type required callers to check length to distinguish "can't split" (length ≤ 1) from "did split" (length 2). The tuple type encodes that distinction structurally: `null` means irreducible; a pair means the two halves. Callers in `puzzle.ts` that need a flat-map idiom use `decompose(c) ?? [c]`.

### fullDecompose(characters) => readonly Character[]

```typescript
function fullDecompose(characters: readonly Character[]): readonly Character[];
```

Recursively applies `decompose` until all Characters are irreducible single-jamo. Use after selecting a word to build the initial jamo pool.

### normalizeCharacter(char) => Character

```typescript
function normalizeCharacter(char: Character): Character;
```

Rotates a single-jamo Character to the canonical (0-index) member of its rotation set. Non-rotatable or multi-jamo Characters are returned unchanged. Delegates to `normalizeJamo` from `jamo/rotation`.

**Operates on single-jamo Characters only.** Multi-jamo Characters (OPEN_SYLLABLE, FULL_SYLLABLE) and EMPTY are returned unchanged. Applied element-wise to a pool after `fullDecompose`, before presenting it to the player, to prevent the pool from revealing which target jamo are rotated.

### getNextRotation(char) => Character | null

```typescript
function getNextRotation(char: Character): Character | null;
```

Advances a single-jamo Character one step through its rotation set (wraps around). Returns `null` if the Character is not single-jamo or its jamo is not in any rotation set. Delegates to `getNextRotation` in `jamo/rotation`.

**Owned by the character module, not consumed directly from `jamo/rotation`.** The game state reducer works in terms of `Character`, not raw `Jamo`. Exposing a `Character → Character | null` entry point here keeps the reducer from importing across layer boundaries and ensures the rotation contract is expressed at the right abstraction level.

## Key Decisions

**Discriminated union, not plain object.** The `kind` field makes exhaustive switch statements safe and ensures invalid slot combinations are unrepresentable rather than caught at runtime.

**Compound batchim stored as a collapsed JONGSEONG_ONLY.** When `composeJamo('ㄱ','ㅅ')` produces `'ㄳ'`, it is stored as `{ kind: "JONGSEONG_ONLY", jongseong: "ㄳ" }`, not as two separate jamo. `decompose()` re-expands it using `COMBINATION_RULES` lookup.
