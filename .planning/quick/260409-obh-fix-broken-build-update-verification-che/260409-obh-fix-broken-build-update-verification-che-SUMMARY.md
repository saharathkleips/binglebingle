# Quick Summary: Fix Broken Build

## Outcome

Build fixed. `pnpm tsc --noEmit` passes clean. All 234 tests pass.

## Changes Made

- **rotation.ts**: Simplified `getNextRotation` — removed overengineered return type, tightened logic
- **composition.ts**: Fixed readonly tuple destructuring (spread), fixed missing `null` return for absent jongseong
- **composition.test.ts**: Removed invalid test cases (consonant passed as jungseong/jongseong)
- **jamo.test.ts**: Removed invalid index access for double consonants that can't be jongseong
- **character.ts**: Added proper type assertions for jamo narrowing (ConsonantJamo/VowelJamo)
- **character.test.ts**: Fixed invalid type passed to `combine()`

## Commit

db4a006 — fix(260409-obh): fix TypeScript build errors
