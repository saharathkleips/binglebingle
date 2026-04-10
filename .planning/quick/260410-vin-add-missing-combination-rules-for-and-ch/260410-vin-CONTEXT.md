# Quick Task 260410-vin: Add missing combination rules for ㅙ (ㅘ+ㅣ) and ㅞ (ㅝ+ㅣ) - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Task Boundary

Add missing combination rules to the COMBINATION_MAP so both valid input paths for ㅙ and ㅞ are supported:
- ㅘ + ㅣ → ㅙ (currently only ㅗ + ㅐ → ㅙ exists)
- ㅝ + ㅣ → ㅞ (currently only ㅜ + ㅔ → ㅞ exists)

Since decompose can only return one canonical form, the decompose path must be chosen. Add appropriate test cases in `src/lib/jamo/composition.test.ts` and `src/lib/character/character.test.ts` where applicable.

</domain>

<decisions>
## Implementation Decisions

### Canonical Decompose Form
- Keep the existing canonical decompose paths: ㅙ → ㅗ+ㅐ, ㅞ → ㅜ+ㅔ
- These match standard Korean keyboard input (2-bul layout) and are the conventional paths
- Do NOT change the DECOMPOSE_MAP entries for ㅙ or ㅞ

### Combination Map Additions
- Add ㅘ + ㅣ → ㅙ as a new COMBINATION_MAP entry (kind: COMPLEX_VOWEL)
- Add ㅝ + ㅣ → ㅞ as a new COMBINATION_MAP entry (kind: COMPLEX_VOWEL)
- Both new rules are composition-only; decompose keeps existing canonical paths

### Test Coverage
- Add test cases for the new combination rules in composition.test.ts
- Add test cases in character.test.ts where the new paths affect character composition

</decisions>

<specifics>
## Specific Ideas

- ㅙ has two valid phonetic decompositions: ㅗ+ㅏ+ㅣ (3-step) or ㅗ+ㅐ (2-step via ㅐ=ㅏ+ㅣ). The game supports both input paths.
- ㅞ has two valid phonetic decompositions: ㅜ+ㅓ+ㅣ (3-step) or ㅜ+ㅔ (2-step via ㅔ=ㅓ+ㅣ). The game supports both input paths.
- The new rules (ㅘ+ㅣ and ㅝ+ㅣ) represent the 3-vowel input path broken into a 2-step combination.

</specifics>
