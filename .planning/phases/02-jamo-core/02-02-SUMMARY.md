---
phase: 02-jamo-core
plan: "02"
subsystem: domain-logic
tags: [hangul, jamo, unicode, vitest, tdd, korean, rotation, composition, syllable]

requires:
  - phase: 02-jamo-core plan 01
    provides: CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX, ROTATION_SETS, ROTATION_MAP, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP

provides:
  - getRotationOptions(jamo) — returns set members excluding self, empty array if non-rotatable
  - getNextRotation(jamo) — returns next set member wrapping around, null if non-rotatable
  - combineJamo(a, b) — commutative combination to double consonant or complex vowel
  - upgradeJongseong(existing, additional) — non-commutative compound batchim upgrade
  - composeSyllable(choseong, jungseong, jongseong?) — UAX#15 syllable block encoding
  - decomposeSyllable(syllable) — syllable block decoding to Compatibility Jamo

affects:
  - 02-03 (Character type uses combineJamo, composeSyllable, decomposeSyllable)
  - 03-word (pool derivation uses decomposeSyllable)
  - 04-engine (evaluateGuess uses composeSyllable/decomposeSyllable)
  - 05-reducer (COMBINE_TOKENS uses combineJamo/upgradeJongseong)

tech-stack:
  added: []
  patterns:
    - "Reverse-lookup maps built at module load via Object.fromEntries for O(1) decomposition"
    - "TDD red-green cycle: test file written first (failing), then implementation"
    - "noUncheckedIndexedAccess handled via ?? null and === undefined guards"

key-files:
  created:
    - src/lib/jamo/rotation.ts
    - src/lib/jamo/rotation.test.ts
    - src/lib/jamo/composition.ts
    - src/lib/jamo/composition.test.ts
  modified: []

key-decisions:
  - "getNextRotation uses ROTATION_SETS.find() to locate the full set for wrap-around calculation — ROTATION_MAP only has other members, not self"
  - "decomposeSyllable builds reverse Record<number,string> maps at module load (Object.fromEntries) rather than searching CHOSEONG_INDEX at call time"
  - "combineJamo uses sorted key [a,b].sort().join('|') to match COMBINATION_MAP construction — commutativity via key normalization"
  - "upgradeJongseong key is unsorted 'existing|additional' — caller responsibility to distinguish combine vs upgrade context"

patterns-established:
  - "Pure lib functions: no React, no side effects, all exported functions have explicit return types and JSDoc"
  - "TDD: failing test committed before implementation; both green before task commit"
  - "noUncheckedIndexedAccess compliance: ?? null for array/object lookups that return T | undefined"

requirements-completed: [JAMO-02, JAMO-03, JAMO-04]

duration: 3min
completed: 2026-04-06
---

# Phase 02 Plan 02: Jamo Operations Summary

**Six pure jamo functions (rotate, combine, upgrade, compose, decompose) implemented with 31 tests — the core linguistic mechanics of the game**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-06T10:14:00Z
- **Completed:** 2026-04-06T10:17:00Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments

- rotation.ts exports `getRotationOptions` and `getNextRotation` with full wrap-around behavior
- composition.ts exports all four functions: `combineJamo` (commutative), `upgradeJongseong` (non-commutative), `composeSyllable` and `decomposeSyllable` (UAX#15 formula)
- 31 new tests covering correct cases, null cases, commutativity, non-commutativity, edge cases, round-trip, and codepoint range checks
- All quality gates pass: pnpm tsc, pnpm test, pnpm lint, pnpm fmt:check

## Task Commits

1. **Task 1: rotation.ts and rotation.test.ts** - `1a60767` (feat)
2. **Task 2: composition.ts and composition.test.ts** - `e335978` (feat)

## Files Created/Modified

- `src/lib/jamo/rotation.ts` — getRotationOptions, getNextRotation using ROTATION_MAP and ROTATION_SETS
- `src/lib/jamo/rotation.test.ts` — 8 tests for both rotation functions
- `src/lib/jamo/composition.ts` — combineJamo, upgradeJongseong, composeSyllable, decomposeSyllable with reverse-lookup maps
- `src/lib/jamo/composition.test.ts` — 23 tests covering all 4 functions

## Decisions Made

- `getNextRotation` cannot rely solely on `ROTATION_MAP` (which excludes self) — it looks up the full set via `ROTATION_SETS.find()` to compute the next index with wrap-around.
- `decomposeSyllable` builds three `Record<number, string>` reverse-lookup maps at module load using `Object.fromEntries`. This avoids O(n) `Object.entries().find()` at each call.
- Format auto-fixed: `oxfmt` reformatted both composition files after initial write (multi-param function signature collapsed to one line).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] oxfmt formatting fix on composition files**
- **Found during:** Task 2 (composition.ts and composition.test.ts)
- **Issue:** `upgradeJongseong` function signature written with multi-line params; oxfmt collapsed to single line
- **Fix:** Ran `pnpm oxfmt src/lib/jamo/composition.ts src/lib/jamo/composition.test.ts`
- **Files modified:** src/lib/jamo/composition.ts, src/lib/jamo/composition.test.ts
- **Verification:** `pnpm fmt:check` exits 0
- **Committed in:** e335978 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (formatting — oxfmt compliance)
**Impact on plan:** Trivial formatting normalization. No logic change.

## Issues Encountered

None — plan executed as specified. The plan's TypeScript notes for `noUncheckedIndexedAccess` were accurate and handled as documented.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All six jamo operation functions are ready for use by the Character layer (Plan 02-03)
- `composeSyllable` and `decomposeSyllable` verified with round-trip test
- `combineJamo` and `upgradeJongseong` verified as commutative/non-commutative respectively
- No stubs — all functions return real computed values

---
*Phase: 02-jamo-core*
*Completed: 2026-04-06*
