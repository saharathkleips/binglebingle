---
phase: quick
plan: 260409-n3l
subsystem: jamo-core
tags:
  - pr-review
  - types
  - tests
  - rotation
  - composition
dependency-graph: []
tech-stack:
  added:
    - TypeScript strict types (Jamo subtypes)
    - Table-driven tests for all 27 combination rules
decisions:
  - "Removed public exports of ROTATION_MAP and COMBINATION_MAP; made them internal via JSDoc @internal tag"
  - "Split VowelJamo into BasicVowelJamo and ComplexVowelJamo subtypes"
  - "Added full table-driven test coverage for all COMBINATION_RULES"
  - "Migrated ROTATION_SETS and COMBINATION_RULES tests to their owning modules"
metrics:
  duration: "0.25s"
  files-created: 0
  files-modified: 6
  tests-added: 23
---

# Phase Quick Plan 260409-n3l Summary

**Applied second batch of PR review suggestions** across rotation, jamo, and composition modules.

## Completed Tasks

### Task 1: rotation.ts + rotation.test.ts
- Changed `ROTATION_SETS` type to `readonly (readonly Jamo[])[]`
- Removed public export of `ROTATION_MAP` (now internal via `@internal` JSDoc)
- Changed `getNextRotation` return type from `string | null` to `Jamo | null`
- Added 4 missing test cases for the ㅑ→ㅠ→ㅕ→ㅛ rotation set
- Migrated ROTATION_SETS structural tests from jamo.test.ts to rotation.test.ts
- Total: 7 ROTATABLE_CASES → 12 ROTATABLE_CASES

### Task 2: jamo.ts + jamo.test.ts
- Split `VowelJamo` into `BasicVowelJamo` (10) and `ComplexVowelJamo` (11) subtypes
- Added `VowelJamo` type as exported union
- Updated `CHOSEONG_BY_INDEX`, `JUNGSEONG_BY_INDEX`, `JONGSEONG_BY_INDEX` with specific subtype annotations
- Merged reverse-map assertions (BY_INDEX) inline into their primary test cases
- Removed ROTATION_SETS and COMBINATION_RULES describe blocks (moved to owning modules)

### Task 3: composition.ts + composition.test.ts
- Updated `CombinationRule` type with Jamo-typed inputs/outputs
- Removed public export of `COMBINATION_MAP` (now internal)
- Simplified `COMBINATION_MAP` and `DECOMPOSE_MAP` builders using `.flatMap` / `.map`
- Added full table-driven test suite for all 27 COMBINATION_RULES
- Added round-trip test suite for decomposeJamo (composes then decomposes returns original)
- Migrated COMBINATION_RULES/COMBINATION_MAP tests from jamo.test.ts to composition.test.ts

## Test Results

| Module | Tests | Status |
|--------|-------|--------|
| rotation.test.ts | 19 | ✅ Pass |
| jamo.test.ts | 73 | ✅ Pass |
| composition.test.ts | 142 | ✅ Pass |
| **Total** | **234** | ✅ Pass |

## Verification

- ✅ `pnpm exec tsc --noEmit` exits 0 (strict mode)
- ✅ `pnpm test` exits 0 (all 234 tests pass)
- ✅ `ROTATION_MAP` and `COMBINATION_MAP` are unexported from public API
- ✅ `BasicVowelJamo` and `ComplexVowelJamo` types exported from jamo.ts
- ✅ All rotation/combination tests moved to owning modules

## Commits

```
git add src/lib/jamo/rotation.ts src/lib/jamo/rotation.test.ts
git add src/lib/jamo/jamo.ts src/lib/jamo/jamo.test.ts
git add src/lib/jamo/composition.ts src/lib/jamo/composition.test.ts
git commit -m "feat(quick-260409-n3l): apply PR review suggestions — tighten types, unexport maps, complete tests"
```
