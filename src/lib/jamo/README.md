# jamo

Low-level Unicode mechanics for Hangul Compatibility Jamo (U+3130–U+318F). Provides static data tables and the pure functions that operate on them.

## Exports

- `Jamo` — string-literal union of all 51 valid Hangul Compatibility Jamo (14 basic consonants, 5 double consonants, 11 compound batchim, 10 basic vowels, 11 complex vowels). Narrower subtypes — `ChoseongJamo`, `JongseongJamo`, `VowelJamo`, `ConsonantJamo` — represent position-specific subsets.
- `composeJamo(a, b) => Jamo | null` — returns the double consonant, complex vowel, or compound batchim produced by combining two jamo, or `null` if no rule exists. Commutative for double consonants and complex vowels; compound batchim require canonical argument order.
- `decomposeJamo(jamo) => readonly [Jamo, Jamo] | null` — returns the two-element tuple `[a, b]` whose composition produces this jamo, or `null` if it is not a combination result.
- `composeSyllable(choseong, jungseong, jongseong?) => string | null` — returns the Unicode syllable block (U+AC00–U+D7A3) for valid inputs, or `null` if any component is not valid for its position.
- `decomposeSyllable(syllable) => { choseong, jungseong, jongseong? } | null` — returns `{ choseong, jungseong, jongseong }` for a syllable block, or `null` if the input is not in U+AC00–U+D7A3.
- `getNextRotation(jamo) => Jamo | null` — returns the next jamo in the rotation cycle (wrapping), or `null` if not rotatable.
- `normalizeJamo(jamo) => Jamo` — returns the 0-index (canonical) member of the rotation set containing this jamo, or the jamo unchanged if not rotatable.
