# Quick Task 260410-vin: Summary

**Task:** Add missing combination rules for ㅙ (ㅘ+ㅣ) and ㅞ (ㅝ+ㅣ)
**Date:** 2026-04-10
**Commit:** e77bb8d

## What Was Done

Added two alternative COMPLEX_VOWEL combination rules to `COMBINATION_RULES` in `src/lib/jamo/composition.ts`:

- `ㅘ + ㅣ → ㅙ` (alternate path — standard is `ㅗ + ㅐ → ㅙ`)
- `ㅝ + ㅣ → ㅞ` (alternate path — standard is `ㅜ + ㅔ → ㅞ`)

Both rules are COMPLEX_VOWEL kind and are therefore commutative in COMBINATION_MAP (both directions work).

**Canonical decompose preserved:** Alternate-input rules are placed BEFORE their canonical counterparts in `COMBINATION_RULES`. Since `DECOMPOSE_MAP` is built via `new Map(COMBINATION_RULES.map(...))` which keeps the last entry for duplicate keys, the canonical entries (`ㅗ+ㅐ→ㅙ`, `ㅜ+ㅔ→ㅞ`) are always used for decomposition.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/jamo/composition.ts` | Added 2 new COMPLEX_VOWEL entries; updated comments (11→13, 27→29) |
| `src/lib/jamo/composition.test.ts` | Deduplicated round-trip suite; added canonical-path and alternate-path test blocks |
| `src/lib/character/character.test.ts` | Extended jungseong+jungseong it.each with ㅘ+ㅣ and ㅝ+ㅣ rows; added choseong+jungseong alternate-path test |

## Test Results

- 240 tests passing (5 test files)
- TypeScript build clean (`pnpm tsc --noEmit`)
