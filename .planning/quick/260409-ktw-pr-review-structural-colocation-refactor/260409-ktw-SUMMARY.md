---
phase: quick
plan: 260409-ktw
subsystem: jamo-core
tags: [refactor, data-colocation, test-quality, pr-review]
dependency_graph:
  requires: []
  provides: [rotation-data-colocated, combination-data-colocated, table-driven-tests]
  affects: [src/lib/jamo/rotation.ts, src/lib/jamo/composition.ts, src/lib/jamo/jamo-data.ts, src/lib/character/character.ts]
tech_stack:
  added: []
  patterns: [it.each table-driven tests, data colocation with owning module]
key_files:
  created: []
  modified:
    - src/lib/jamo/rotation.ts
    - src/lib/jamo/composition.ts
    - src/lib/jamo/jamo-data.ts
    - src/lib/character/character.ts
    - src/lib/jamo/rotation.test.ts
    - src/lib/jamo/jamo-data.test.ts
decisions:
  - rotation.ts owns ROTATION_SETS and ROTATION_MAP inline; no jamo-data import for rotation concerns
  - composition.ts owns CombinationRule, COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, combinationOf inline
  - jamo-data.ts is now a pure index-table file with only the six position ordinal tables
  - getRotationOptions removed as it was unused in production code
  - getNextRotation parameter tightened from string to Jamo type
metrics:
  duration: ~5min
  completed_date: "2026-04-09T06:05:00Z"
  tasks_completed: 3
  files_modified: 6
---

# Quick 260409-ktw: PR Review — Structural Colocation Refactor Summary

**One-liner:** Data colocation refactor moving ROTATION_SETS/ROTATION_MAP into rotation.ts and all combination data into composition.ts, leaving jamo-data.ts as a pure index-table file, with table-driven test rewrites.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Colocate data — rotation to rotation.ts, combination to composition.ts, update imports | d7009a4 | rotation.ts, composition.ts, jamo-data.ts, character.ts |
| 2 | Refactor rotation.test.ts — remove getRotationOptions, table-drive getNextRotation | e8cb7f6 | rotation.test.ts |
| 3 | Update jamo-data.test.ts — fix imports, refactor JUNGSEONG_INDEX to table-driven | 30c8d95 | jamo-data.test.ts |

## What Changed

### rotation.ts
- Removed `import { ROTATION_MAP, ROTATION_SETS } from "./jamo-data"`
- Added `import type { Jamo } from "./types"`
- Inlined ROTATION_SETS and ROTATION_MAP with full JSDoc
- Changed `getNextRotation(jamo: string)` to `getNextRotation(jamo: Jamo)`
- Removed `getRotationOptions` entirely (was unused in production code)

### composition.ts
- Removed COMBINATION_MAP and JONGSEONG_UPGRADE_MAP from jamo-data import
- Inlined CombinationRule type, COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, combinationOf with full JSDoc
- All combination data now colocated with the functions that use it

### jamo-data.ts
- Removed: CombinationRule type, ROTATION_SETS, ROTATION_MAP, COMBINATION_RULES, COMBINATION_MAP, combinationOf, JONGSEONG_UPGRADE_MAP
- Now exports only: CHOSEONG_INDEX/BY_INDEX, JUNGSEONG_INDEX/BY_INDEX, JONGSEONG_INDEX/BY_INDEX
- Updated file-level JSDoc to reflect pure index-table role

### character.ts
- Changed `import { COMBINATION_RULES } from "../jamo/jamo-data"` to `import { COMBINATION_RULES } from "../jamo/composition"`

### rotation.test.ts
- Removed getRotationOptions import and its 4-test describe block
- Rewrote getNextRotation suite as two it.each blocks: 10 rotatable cases (all wrap-arounds covered) and 5 non-rotatable null cases

### jamo-data.test.ts
- Split imports: ROTATION_SETS/ROTATION_MAP from `./rotation`, combination data from `./composition`
- Replaced JUNGSEONG_INDEX individual it() tests with a 21-entry EXPECTED_JUNGSEONG it.each table matching CHOSEONG_INDEX style

## Verification Results

- pnpm test: 204 passed (5 test files)
- pnpm tsc --noEmit: 0 errors
- jamo-data.ts has no ROTATION/COMBINATION exports (verified by grep)
- character.ts imports COMBINATION_RULES from composition (verified by grep)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- src/lib/jamo/rotation.ts: FOUND
- src/lib/jamo/composition.ts: FOUND
- src/lib/jamo/jamo-data.ts: FOUND
- src/lib/character/character.ts: FOUND
- src/lib/jamo/rotation.test.ts: FOUND
- src/lib/jamo/jamo-data.test.ts: FOUND
- Commit d7009a4: FOUND
- Commit e8cb7f6: FOUND
- Commit 30c8d95: FOUND
