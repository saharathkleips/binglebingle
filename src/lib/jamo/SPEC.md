# SPEC: Jamo

**Status:** stable
**Slice:** `src/lib/jamo/`

## Purpose

Everything that is a fact about the Korean writing system: rotation rules, combination rules, syllable composition and decomposition, Unicode index tables. The linguistic foundation every other domain calls into.

**Boundaries:**

- In: raw jamo strings, syllable block strings
- Out: transformed jamo strings, composed/decomposed syllables, lookup results
- Calls into: nothing
- No knowledge of: game rules, pool state, UI, React

All exports are pure functions or readonly constants.

## File Map

```
src/lib/jamo/
├── jamo.ts             # type definitions + CHOSEONG/JUNGSEONG/JONGSEONG index tables
├── rotation.ts         # ROTATION_SETS, getNextRotation()
├── composition.ts      # CombinationRule, COMBINATION_RULES, composeJamo(), decomposeJamo(), composeSyllable(), decomposeSyllable()
├── jamo.test.ts
├── rotation.test.ts
└── composition.test.ts
```

## Types

```typescript
// jamo.ts — position-specific type aliases
type BasicConsonantJamo    // 14 basic consonants
type DoubleConsonantJamo   // 5 double consonants (ㄲ ㄸ ㅃ ㅆ ㅉ)
type CompoundBatchimJamo   // 11 compound batchim (ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ)
type ConsonantJamo         // BasicConsonantJamo | DoubleConsonantJamo | CompoundBatchimJamo
type ChoseongJamo          // BasicConsonantJamo | DoubleConsonantJamo (19 members)
type JongseongJamo         // ConsonantJamo excluding ㄸ/ㅃ/ㅉ (27 members)
type BasicVowelJamo        // 10 basic vowels
type ComplexVowelJamo      // 11 complex vowels
type VowelJamo             // BasicVowelJamo | ComplexVowelJamo (21 members)
type Jamo                  // ConsonantJamo | VowelJamo (51 members total)

// composition.ts
type CombinationRule = {
  inputs: readonly [Jamo, Jamo];
  output: Jamo;
  kind: "DOUBLE_CONSONANT" | "COMPLEX_VOWEL" | "COMPOUND_BATCHIM";
  alternate?: true; // alternate input path that produces the same output; excluded from DECOMPOSE_MAP
};
```

## Data Tables

**Choseong (19 entries):** ㄱ:0 ㄲ:1 ㄴ:2 ㄷ:3 ㄸ:4 ㄹ:5 ㅁ:6 ㅂ:7 ㅃ:8 ㅅ:9 ㅆ:10 ㅇ:11 ㅈ:12 ㅉ:13 ㅊ:14 ㅋ:15 ㅌ:16 ㅍ:17 ㅎ:18

**Jungseong (21 entries):** ㅏ:0 ㅐ:1 ㅑ:2 ㅒ:3 ㅓ:4 ㅔ:5 ㅕ:6 ㅖ:7 ㅗ:8 ㅘ:9 ㅙ:10 ㅚ:11 ㅛ:12 ㅜ:13 ㅝ:14 ㅞ:15 ㅟ:16 ㅠ:17 ㅡ:18 ㅢ:19 ㅣ:20

**Jongseong (28 entries, index 0 = no final consonant):** '':0 ㄱ:1 ㄲ:2 ㄳ:3 ㄴ:4 ㄵ:5 ㄶ:6 ㄷ:7 ㄹ:8 ㄺ:9 ㄻ:10 ㄼ:11 ㄽ:12 ㄾ:13 ㄿ:14 ㅀ:15 ㅁ:16 ㅂ:17 ㅄ:18 ㅅ:19 ㅆ:20 ㅇ:21 ㅈ:22 ㅊ:23 ㅋ:24 ㅌ:25 ㅍ:26 ㅎ:27

Note: ㄸ, ㅃ, ㅉ are valid choseong but NOT valid jongseong.

## Rotation Sets

Designer-controlled sets in `rotation.ts`. Jamo not in any set are not rotatable.

```
["ㄱ", "ㄴ"]
["ㅏ", "ㅜ", "ㅓ", "ㅗ"]   // clockwise
["ㅣ", "ㅡ"]
["ㅑ", "ㅠ", "ㅕ", "ㅛ"]   // clockwise
```

`getNextRotation` cycles forward and wraps; returns null for non-rotatable jamo.

## Key Decisions

**J1 — Compatibility Jamo only.** All table entries use U+3130–U+318F (Hangul Compatibility Jamo), not U+1100–U+11FF (Hangul Jamo). Verify: `'ㄱ'.codePointAt(0) === 0x3131`. Copy-pasting from sources using the Jamo block causes silent lookup failures.

**J2 — Commutativity via dual map entries, not sorted keys.** `COMBINATION_MAP` stores both `"a|b"` and `"b|a"` for DOUBLE_CONSONANT and COMPLEX_VOWEL rules. COMPOUND_BATCHIM rules store only canonical `"a|b"` (e.g. `"ㄱ|ㅅ"→ㄳ`; `"ㅅ|ㄱ"` has no entry). Key format is `"${a}|${b}"` — not sorted.

**J3 — `composeJamo` produces compound batchim.** `composeJamo('ㄱ','ㅅ')` returns `'ㄳ'`. Compound batchim rules are part of `COMBINATION_RULES` with `kind: "COMPOUND_BATCHIM"`. The caller (`compose()` in character/) decides whether to invoke this based on slot context.

**J4 — Alternate input rules for ㅙ and ㅞ.** Both complex vowels can be reached via two paths. `alternate: true` rules are included in `COMBINATION_MAP` (compose) but excluded from `DECOMPOSE_MAP` (decompose always returns the canonical path).

**J5 — `decomposeSyllable` returns compatibility jamo.** Verified by: `decomposeSyllable('가')?.choseong === 'ㄱ'` where `'ㄱ'.codePointAt(0) === 0x3131`.
