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
├── jamo-data.ts        # all static data: index tables, rotation sets, combination rules
├── rotation.ts         # getRotationOptions(), getNextRotation()
├── composition.ts      # combineJamo(), upgradeJongseong(), composeSyllable(), decomposeSyllable()
├── jamo-data.test.ts
├── rotation.test.ts
└── composition.test.ts
```

## Types

```typescript
// jamo-data.ts
type CombinationRule = {
  inputs: readonly [string, string];
  output: string;
  kind: "doubleConsonant" | "complexVowel";
};

type JongseongUpgradeRule = {
  existing: string;   // single consonant already in jongseong position
  additional: string; // consonant being added
  output: string;     // resulting compound batchim
};
```

## Data Tables

**Choseong (19 entries):** ㄱ:0 ㄲ:1 ㄴ:2 ㄷ:3 ㄸ:4 ㄹ:5 ㅁ:6 ㅂ:7 ㅃ:8 ㅅ:9 ㅆ:10 ㅇ:11 ㅈ:12 ㅉ:13 ㅊ:14 ㅋ:15 ㅌ:16 ㅍ:17 ㅎ:18

**Jungseong (21 entries):** ㅏ:0 ㅐ:1 ㅑ:2 ㅒ:3 ㅓ:4 ㅔ:5 ㅕ:6 ㅖ:7 ㅗ:8 ㅘ:9 ㅙ:10 ㅚ:11 ㅛ:12 ㅜ:13 ㅝ:14 ㅞ:15 ㅟ:16 ㅠ:17 ㅡ:18 ㅢ:19 ㅣ:20

**Jongseong (28 entries, index 0 = no final consonant):** '':0 ㄱ:1 ㄲ:2 ㄳ:3 ㄴ:4 ㄵ:5 ㄶ:6 ㄹ:7 ㄺ:8 ㄻ:9 ㄼ:10 ㄽ:11 ㄾ:12 ㄿ:13 ㅀ:14 ㅁ:15 ㅂ:16 ㅄ:17 ㅅ:18 ㅆ:19 ㅇ:20 ㅈ:21 ㅊ:22 ㅋ:23 ㅌ:24 ㅍ:25 ㅎ:26

Note: ㄸ, ㅃ, ㅉ are valid choseong but NOT valid jongseong.

## Key Decisions

**J1 — Compatibility Jamo only.** All table entries use U+3130–U+318F (Hangul Compatibility Jamo), not U+1100–U+11FF (Hangul Jamo). Verify: `'ㄱ'.codePointAt(0) === 0x3131`. Copy-pasting from sources using the Jamo block causes silent lookup failures.

**J2 — Combination is commutative; jongseong upgrade is not.** `COMBINATION_MAP` keys are sorted pairs (`[a,b].sort().join('|')`). `JONGSEONG_UPGRADE_MAP` keys are ordered `'existing|additional'` — `ㄱ+ㅅ→ㄳ` is valid, `ㅅ+ㄱ` is not.

**J3 — `combineJamo` does not produce compound batchim.** `combineJamo('ㄱ','ㅅ')` returns `null`. Use `upgradeJongseong` instead. The caller (reducer) decides which applies based on context.

**J4 — Rotation wraps around.** `getNextRotation` cycles through the set and wraps: the last member returns the first. `getRotationOptions` excludes self.

**J5 — `decomposeSyllable` returns compatibility jamo.** Verified by: `decomposeSyllable('가')?.choseong === 'ㄱ'` where `'ㄱ'.codePointAt(0) === 0x3131`.
