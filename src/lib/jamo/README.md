# jamo

Low-level Unicode mechanics for Hangul Compatibility Jamo (U+3130–U+318F). Provides static data tables and the pure functions that operate on them.

## Contracts

- `Jamo` — string-literal union of all 51 valid Hangul Compatibility Jamo (14 basic consonants, 5 double consonants, 11 compound batchim, 10 basic vowels, 11 complex vowels). Narrower subtypes — `ChoseongJamo`, `JongseongJamo`, `VowelJamo`, `ConsonantJamo` — represent position-specific subsets.
- `composeJamo(a, b)` — returns the double consonant, complex vowel, or compound batchim produced by combining two jamo, or `null` if no rule exists. Commutative for double consonants and complex vowels; compound batchim require canonical argument order.
- `decomposeJamo(jamo)` — returns the two-element tuple `[a, b]` whose composition produces this jamo, or `null` if it is not a combination result.
- `composeSyllable(choseong, jungseong, jongseong?)` — returns the Unicode syllable block (U+AC00–U+D7A3) for valid inputs, or `null` if any component is not valid for its position.
- `decomposeSyllable(syllable)` — returns `{ choseong, jungseong, jongseong }` for a syllable block, or `null` if the input is not in U+AC00–U+D7A3.
- `getNextRotation(jamo)` — returns the next jamo in the rotation cycle (wrapping), or `null` if not rotatable.
- All jamo arguments must be Hangul Compatibility Jamo. Mixing in Hangul Jamo (U+1100–U+11FF) produces incorrect results.
- All functions are pure — no side effects, no module-level state beyond lookup maps built once at load time.

## Out of scope

- Game rules for how a player builds a character — that is `character/combine`.
- Which jamo belong in which position for a given game state — callers are responsible for passing semantically correct inputs.
- Rotation set design — sets are defined in `jamo.ts` and are designer-controlled, not derived from Unicode.
