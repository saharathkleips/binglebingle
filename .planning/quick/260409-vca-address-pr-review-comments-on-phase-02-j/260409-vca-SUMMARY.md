---
id: 260409-vca
type: quick
date: "2026-04-09"
subsystem: jamo-core
tags: [refactor, types, tests, api-cleanup]
key-files:
  modified:
    - src/lib/jamo/rotation.ts
    - src/lib/jamo/rotation.test.ts
    - src/lib/jamo/jamo.test.ts
    - src/lib/jamo/composition.ts
    - src/lib/jamo/composition.test.ts
    - src/lib/character/character.ts
    - src/lib/character/README.md
  deleted:
    - src/lib/character/types.ts
decisions:
  - ROTATION_SETS is internal-only; getNextRotation is the sole public API for rotation
  - decomposeJamo return type is readonly [Jamo, Jamo] | null (no spread needed — DECOMPOSE_MAP stores readonly tuples)
  - Character.choseong typed as ChoseongJamo, Character.jongseong as JongseongJamo — tighter than ConsonantJamo
  - resolveCharacter returns null for {jungseong, jongseong} without choseong (invalid syllable state)
  - decomposeSyllable re-export removed from character.ts; callers use jamo/composition directly
  - types.ts deleted; Character type and re-exports folded into character.ts
metrics:
  duration: "10 min"
  completed: "2026-04-09"
  tasks: 3
  files: 8
---

# Quick Task 260409-vca: Address PR Review Comments on Phase 02 Jamo Core

One-liner: Clean up 17 PR review comments — hide ROTATION_SETS, flatten IIFE to flatMap, tighten Character slot types to ChoseongJamo/JongseongJamo, delete types.ts, remove decomposeSyllable re-export, merge test reverse-map assertions, table-drive decomposeSyllable tests from COMPOSE_CASES.

## Tasks Completed

| # | Name | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | rotation.ts and jamo.test.ts — hide ROTATION_SETS and merge reverse-lookup tests | 9e70ee6 | Remove `export` from ROTATION_SETS; delete ROTATION_SETS describe block in rotation.test.ts; merge 3 standalone reverse-map `it()` blocks into `it.each` rows with `↔` notation |
| 2 | composition.ts and composition.test.ts — simplify builder, remove cast, fix test structure | 505d87c | Replace IIFE with `.flatMap` in COMBINATION_MAP; update `decomposeJamo` return type to `readonly [Jamo, Jamo] \| null`; remove cast in `getTypedRules`; move COMPOSE_CASES to module scope; table-drive decomposeSyllable happy-path tests |
| 3 | character module — fold types.ts, fix logic bugs, remove re-export, fix README | a066d30 | Delete types.ts and fold into character.ts; tighten Character type (ChoseongJamo/JongseongJamo); add guard for {jungseong, jongseong} without choseong; remove redundant `?? null`; remove `decomposeSyllable` re-export; update README naming clarity |

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as written with one minor deviation:

**[Rule 2 - Missing functionality] rotation.test.ts ROTATION_SETS describe block removed**
- The plan said to remove ROTATION_SETS import from test and delete tests that use it. The `rotation.test.ts` had a full `describe("ROTATION_SETS")` block with 6 tests testing internal structure (set count, disjointness, clockwise order, etc.). Per the plan's instruction, all tests importing ROTATION_SETS were removed, since the public `getNextRotation` function covers the externally visible behavior. The behavior tested by the structural tests (clockwise vowel order, disjointness) is indirectly verified by the existing `getNextRotation` rotation-order tests.

## Verification

- `pnpm typecheck`: PASS (0 errors)
- `pnpm test`: PASS (230 tests, 5 test files)

## Self-Check: PASSED

Files verified present:
- src/lib/jamo/rotation.ts (ROTATION_SETS not exported)
- src/lib/jamo/jamo.test.ts (bidirectional assertions, no standalone reverse-map tests)
- src/lib/jamo/composition.ts (flatMap builder, readonly return type)
- src/lib/jamo/composition.test.ts (COMPOSE_CASES at module scope, table-driven decomposeSyllable)
- src/lib/character/character.ts (types folded in, ChoseongJamo/JongseongJamo, guard added)
- src/lib/character/README.md (naming clarified)

Files verified deleted:
- src/lib/character/types.ts (deleted)

Commits verified:
- 9e70ee6 (Task 1)
- 505d87c (Task 2)
- a066d30 (Task 3)
