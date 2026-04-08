# jamo

Low-level Unicode mechanics for Hangul Compatibility Jamo (U+3130–U+318F). Provides static data tables and the pure functions that operate on them.

## Contracts

- `combineJamo(a, b)` — returns the double consonant or complex vowel produced by combining two jamo, or `null` if no rule exists. Commutative: argument order does not affect the result.
- `upgradeJongseong(existing, additional)` — returns the compound batchim produced by adding a consonant to an existing jongseong, or `null`. Not commutative.
- `composeSyllable(choseong, jungseong, jongseong?)` — returns the Unicode syllable block (U+AC00–U+D7A3) for valid inputs, or `null` if any component is not valid for its position.
- `decomposeSyllable(syllable)` — returns `{ choseong, jungseong, jongseong }` for a syllable block, or `null` if the input is not in U+AC00–U+D7A3.
- `getRotationOptions(jamo)` — returns all jamo this one can rotate to (excluding itself), or `[]` if not rotatable.
- `getNextRotation(jamo)` — returns the next jamo in the rotation cycle (wrapping), or `null` if not rotatable.
- All jamo arguments must be Hangul Compatibility Jamo. Mixing in Hangul Jamo (U+1100–U+11FF) produces incorrect results.
- All functions are pure — no side effects, no module-level state beyond lookup maps built once at load time.

## Out of scope

- Game rules for how a player builds a character — that is `character/combine`.
- Which jamo belong in which position for a given game state — callers are responsible for passing semantically correct inputs.
- Rotation set design — sets are defined in `jamo-data.ts` and are designer-controlled, not derived from Unicode.
