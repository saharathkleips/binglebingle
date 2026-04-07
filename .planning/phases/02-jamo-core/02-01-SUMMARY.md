---
phase: 02-jamo-core
plan: 01
subsystem: testing
tags: [hangul, unicode, jamo, vitest, typescript]

# Dependency graph
requires:
  - phase: 01-scaffold
    provides: Vite + Vitest + TypeScript strict-mode project scaffold
provides:
  - All static Unicode data tables for the jamo domain (CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX)
  - Runtime lookup maps: ROTATION_MAP, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP
  - CombinationRule and JongseongUpgradeRule type definitions
  - Data invariant test suite (21 tests)
affects: [02-02, 02-03, character domain, composition, rotation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IIFE map construction: derived ReadonlyMap built once at module load from static arrays"
    - "No-import data file: jamo-data.ts has zero imports — all data inline for tree-shaking"
    - "Readonly types: all exported constants use Readonly<> or ReadonlyMap<> to prevent mutation"

key-files:
  created:
    - src/lib/jamo/jamo-data.ts
    - src/lib/jamo/jamo-data.test.ts
  modified: []

key-decisions:
  - "JONGSEONG_INDEX has 28 entries (including ㄷ at index 7) to match Unicode UAX#15 exactly — plan-jamo.md omitted ㄷ but Unicode slot 7 = ᆮ (modern batchim used in e.g. 맏, 곧)"
  - "JONGSEONG_UPGRADE_RULES are NOT commutative — key format is 'existing|additional' unsorted, matching how the mechanic works (order matters)"
  - "COMBINATION_MAP keys ARE sorted — commutativity enforced at lookup time, not at rule definition"

patterns-established:
  - "IIFE derived maps: new Map built from static array in IIFE, assigned to ReadonlyMap constant"
  - "Colocated tests: jamo-data.test.ts lives next to jamo-data.ts in src/lib/jamo/"

requirements-completed: [JAMO-01]

# Metrics
duration: ~25min
completed: 2026-04-06
---

# Phase 02 Plan 01: Jamo Data Summary

**All 9 Unicode jamo data tables and derived maps with 21 passing invariant tests — data foundation for rotation, combination, and syllable composition**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-06T10:00:00Z
- **Completed:** 2026-04-06T10:25:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/lib/jamo/jamo-data.ts` with all 9 exports: three Unicode index tables, two rotation exports, two combination exports, two jongseong upgrade exports
- Wrote 21 data invariant tests covering entry counts, codepoint ranges, map correctness, and commutativity
- Fixed Unicode correctness bug: JONGSEONG_INDEX now has correct 28 entries matching UAX#15

## Task Commits

Each task was committed atomically:

1. **Task 1: Write jamo-data.ts** - `61d6317` (feat)
2. **Fix: correct JONGSEONG_INDEX 28 entries** - `811ed81` (fix — Rule 1 auto-fix)
3. **Task 2: Write jamo-data.test.ts** - `040e1ff` (test)

_Note: TDD task — implementation first, tests confirmed correctness and revealed data bug_

## Files Created/Modified
- `src/lib/jamo/jamo-data.ts` - All static Unicode tables and derived runtime maps; no imports; exports CombinationRule and JongseongUpgradeRule types
- `src/lib/jamo/jamo-data.test.ts` - 21 data invariant tests for all 9 exports

## Decisions Made
- ㄷ added to JONGSEONG_INDEX at index 7: Unicode standard (UAX#15) has ᆮ (jongseong tikeut) at slot 7. Modern Korean does use ㄷ as batchim (e.g. 맏, 곧). plan-jamo.md listed 27 entries but labeled them "28" — the fix adds ㄷ at 7 and shifts ㄹ through ㅎ up by one (ㅎ is now 27 not 26).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JONGSEONG_INDEX missing ㄷ at Unicode slot 7**
- **Found during:** Task 2 (jamo-data.test.ts) — test `contains exactly 28 entries` failed (actual: 27)
- **Issue:** plan-jamo.md table omits ㄷ (Unicode jongseong U+11AE) and places ㄹ at index 7. Unicode standard requires ᆮ (ㄷ) at slot 7 and ᆯ (ㄹ) at slot 8. With ㄹ at index 7, `composeSyllable` would produce wrong characters for any word with ㄹ batchim (e.g., 달 would become 갇 instead).
- **Fix:** Added `ㄷ: 7` to JONGSEONG_INDEX, shifted ㄹ→8 through ㅎ→27 (28 entries total)
- **Files modified:** src/lib/jamo/jamo-data.ts
- **Verification:** All 21 tests pass; pnpm tsc exits 0
- **Committed in:** `811ed81`

---

**Total deviations:** 1 auto-fixed (Rule 1 - data correctness bug)
**Impact on plan:** Essential correctness fix. Without it, syllable composition would silently produce wrong Unicode codepoints for any word containing ㄹ, ㄺ, ㄻ, ㄼ, ㄽ, ㄾ, ㄿ, ㅀ, ㅁ, ㅂ, ㅄ, ㅅ, ㅆ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, or ㅎ as batchim.

## Issues Encountered
- plan-jamo.md jongseong table says "28 entries" but only lists 27 (skips ㄷ at slot 7). Fixed inline per Rule 1. The docs may need updating in a future pass, but no doc update is strictly required for the game to work since the source of truth is now jamo-data.ts.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/lib/jamo/jamo-data.ts` is complete and tested — ready to be imported by rotation.ts (02-02) and composition.ts (02-03)
- All downstream plans depend on ROTATION_SETS, ROTATION_MAP, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP from this file

---
## Self-Check: PASSED

- FOUND: src/lib/jamo/jamo-data.ts
- FOUND: src/lib/jamo/jamo-data.test.ts
- FOUND: .planning/phases/02-jamo-core/02-01-SUMMARY.md
- FOUND: commit 61d6317 (feat: jamo-data.ts)
- FOUND: commit 811ed81 (fix: JONGSEONG_INDEX 28 entries)
- FOUND: commit 040e1ff (test: jamo-data.test.ts)
- All 21 tests pass

*Phase: 02-jamo-core*
*Completed: 2026-04-06*
