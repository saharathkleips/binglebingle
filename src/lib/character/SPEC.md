# SPEC: Character

**Status:** stable
**Slice:** `src/lib/character/`

## Purpose

`Character` is the central player-facing abstraction. It represents a Korean syllable under construction, keyed by slot (choseong / jungseong / jongseong) rather than a flat jamo list. This module encodes Korean syllable construction rules and is the primary interface the game state reducer works through.

**Boundaries:**

- In: `Character` values, `Jamo` strings
- Out: resolved string or null, boolean completion status, decomposed Characters
- Calls into: `src/lib/jamo/` for combination and syllable composition
- No knowledge of: game state, pool, UI, React

## File Map

```
src/lib/character/
├── character.ts        # Character type, CompleteCharacter, character(), compose(), resolveCharacter(), isComplete(), decompose(), normalizeCharacter()
└── character.test.ts
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

## Function Signatures

```typescript
function character(syllable: string): CompleteCharacter | null;
function character(slots?: {
  choseong?: Jamo;
  jungseong?: Jamo;
  jongseong?: Jamo;
}): Character | null;
function compose(target: Character, incoming: Character): Character | null;
function resolveCharacter(char: Character): string | null;
function isComplete(char: Character): char is CompleteCharacter;
function decompose(char: Character): Character[];
function normalizeCharacter(char: Character): Character;
```

## compose() Rules

`compose(target, incoming)` merges incoming into target following syllable construction rules. Returns null if the merge is not permitted.

- EMPTY target: absorbs incoming as-is (even multi-slot)
- EMPTY incoming: always null
- CHOSEONG_ONLY + CHOSEONG_ONLY: `composeJamo` (double consonant or compound batchim result)
- CHOSEONG_ONLY + JUNGSEONG_ONLY: becomes OPEN_SYLLABLE
- OPEN_SYLLABLE + JUNGSEONG_ONLY: `composeJamo` on the jungseong (complex vowel)
- OPEN_SYLLABLE + CHOSEONG_ONLY: consonant fills jongseong slot (factory rejects ㄸ/ㅃ/ㅉ)
- FULL_SYLLABLE + CHOSEONG_ONLY: `composeJamo` on jongseong (compound batchim)
- Multi-slot + multi-slot (both have 2+ jamo): null — would require dropping jamo

Commutativity is also supported when the incoming is a larger unit: e.g. `CHOSEONG_ONLY` target + `OPEN_SYLLABLE` incoming routes the consonant into the incoming syllable's jongseong slot.

## resolveCharacter() Output

| kind           | output                                            |
| -------------- | ------------------------------------------------- |
| EMPTY          | `null`                                            |
| CHOSEONG_ONLY  | bare consonant string                             |
| JUNGSEONG_ONLY | bare vowel string                                 |
| JONGSEONG_ONLY | bare consonant string (compound batchim)          |
| OPEN_SYLLABLE  | `composeSyllable(choseong, jungseong)`            |
| FULL_SYLLABLE  | `composeSyllable(choseong, jungseong, jongseong)` |

## decompose() Rules

Steps a Character back by one construction level — never drops a jamo.

- EMPTY → `[]`
- CHOSEONG_ONLY (simple) → `[itself]`
- CHOSEONG_ONLY (double consonant, e.g. ㄲ) → `[cho first, cho second]`
- JUNGSEONG_ONLY (simple) → `[itself]`
- JUNGSEONG_ONLY (complex vowel, e.g. ㅘ) → `[jung base, jung last]`
- JONGSEONG_ONLY (simple) → `[itself]`
- JONGSEONG_ONLY (compound batchim, e.g. ㄳ) → `[cho first, cho second]`
- OPEN_SYLLABLE (simple vowel) → `[choseong, jungseong]`
- OPEN_SYLLABLE (complex vowel) → `[open(choseong, base), jungseong last]`
- FULL_SYLLABLE (simple jongseong) → `[open(choseong, jungseong), cho jongseong]`
- FULL_SYLLABLE (compound jongseong) → `[full(choseong, jungseong, first), cho second]`

## Key Decisions

**C1 — Discriminated union, not plain object.** The `kind` field makes exhaustive switch statements safe and ensures invalid slot combinations are unrepresentable rather than caught at runtime.

**C2 — `character()` factory rejects ㄸ/ㅃ/ㅉ as jongseong.** These double consonants are only valid as choseong. The factory delegates to `JONGSEONG_INDEX` membership check — callers never need to guard separately.

**C3 — Compound batchim stored as a collapsed JONGSEONG_ONLY.** When `composeJamo('ㄱ','ㅅ')` produces `'ㄳ'`, it is stored as `{ kind: "JONGSEONG_ONLY", jongseong: "ㄳ" }`, not as two separate jamo. `decompose()` re-expands it using `COMBINATION_RULES` lookup.

**C4 — `isComplete` checks the resolved codepoint, not the kind.** Only OPEN_SYLLABLE and FULL_SYLLABLE produce values in U+AC00–U+D7A3, but the check is done via codepoint rather than kind to avoid coupling to the union shape.

**C5 — `normalizeCharacter` operates on single-jamo Characters only.** Multi-jamo Characters (OPEN_SYLLABLE, FULL_SYLLABLE) and EMPTY are returned unchanged. The function delegates to `normalizeJamo` from `jamo/rotation` and is applied element-wise to a pool after full decomposition, before presenting it to the player.
