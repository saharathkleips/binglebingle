---
phase: quick
plan: 260411-kat
subsystem: jamo-core / character
tags: [decompose, right-to-left, jamo, composition, character, undo-mechanic]
dependency_graph:
  requires: []
  provides: [right-to-left decompose semantics in character.ts]
  affects: [game undo mechanic, decompose() call sites]
tech_stack:
  added: []
  patterns: [right-to-left decomposition, canonical-alternate jamo rule designation]
key_files:
  modified:
    - src/lib/jamo/composition.ts
    - src/lib/jamo/composition.test.ts
    - src/lib/character/character.ts
    - src/lib/character/character.test.ts
    - src/lib/character/README.md
decisions:
  - "ㅘ+ㅣ is the canonical decompose path for ㅙ (not ㅗ+ㅐ) — mirrors player construction order"
  - "ㅝ+ㅣ is the canonical decompose path for ㅞ (not ㅜ+ㅔ) — mirrors player construction order"
  - "cho+complex-jung decompose keeps choseong bound to base vowel — feels like natural one-step undo"
  - "compound jongseong splits into first-stays-as-jong/second-becomes-cho — one decompose call per jamo added"
metrics:
  duration_seconds: 171
  completed_date: "2026-04-11"
  tasks_completed: 3
  files_modified: 5
---

# Quick Task 260411-kat: Decompose Right-to-Left Semantics Summary

**One-liner:** Right-to-left decompose semantics via canonical swap for ㅙ/ㅞ rules and new cho+complex-jung and compound-jong split paths in character.ts.

## What Was Done

Three tasks executed to make `decompose()` follow last-added-first (right-to-left) semantics — matching the Korean speaker's mental model of undoing the last keystroke.

### Task 1: Swap canonical/alternate for ㅙ and ㅞ

**Files:** `src/lib/jamo/composition.ts`, `src/lib/jamo/composition.test.ts`, `src/lib/character/character.test.ts`

Swapped the `alternate: true` flag between the two input paths for ㅙ and ㅞ:

- `ㅗ+ㅐ→ㅙ` is now `alternate: true` (compose still works; decompose no longer returns this path)
- `ㅘ+ㅣ→ㅙ` is now canonical (decompose returns `["ㅘ", "ㅣ"]`)
- `ㅜ+ㅔ→ㅞ` is now `alternate: true`
- `ㅝ+ㅣ→ㅞ` is now canonical (decompose returns `["ㅝ", "ㅣ"]`)

Updated test descriptions to say canonical/alternate correctly. No behavior change to `composeJamo()` — both paths still produce the correct output vowel.

**Commit:** 4c9ee59

### Task 2: Update decompose() for right-to-left semantics

**Files:** `src/lib/character/character.ts`, `src/lib/character/character.test.ts`

Two paths in `decompose()` updated:

**Path 1 — cho+jung with complex jungseong:** Instead of always splitting `{choseong}` and `{jungseong}` as two atoms, the function now calls `decomposeJamo(jungseong)`. If the vowel is complex, choseong stays bound to the base vowel part and only the last-added vowel part is peeled off. Example: 화 `{ㅎ,ㅘ}` → `[{ㅎ,ㅗ}, {ㅏ}]` in a single call (was a two-step process).

**Path 2 — full syllable with compound jongseong:** Instead of returning the compound batchim intact as `{jongseong}`, the function now finds the `COMPOUND_BATCHIM` rule, splits it, keeps the first consonant as `jongseong`, and returns the second as a standalone `{choseong}`. Example: 홳 `{ㅎ,ㅙ,ㄳ}` → `[{ㅎ,ㅙ,ㄱ}, {ㅅ}]`.

Workflow tests for 화, 홰, and 홳 updated accordingly. All 307 tests pass.

**Commit:** e0e25e8

### Task 3: Update character/README.md decompose contract

**Files:** `src/lib/character/README.md`

Replaced the single-line `decompose(char)` description with a full contract documenting right-to-left semantics, all cases with examples (화, 호, 홳), and the "at most two results" guarantee.

**Commit:** 024b78a

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files exist:
- src/lib/jamo/composition.ts — FOUND
- src/lib/jamo/composition.test.ts — FOUND
- src/lib/character/character.ts — FOUND
- src/lib/character/character.test.ts — FOUND
- src/lib/character/README.md — FOUND

Commits exist:
- 4c9ee59 — feat(quick-260411-kat): swap canonical/alternate for ㅙ and ㅞ combination rules
- e0e25e8 — feat(quick-260411-kat): update decompose() for right-to-left (last-added-first) semantics
- 024b78a — docs(quick-260411-kat): update character README decompose contract for right-to-left semantics

Test result: 307 passed, 0 failed.
TypeScript: clean (pnpm tsc --noEmit — no output).
