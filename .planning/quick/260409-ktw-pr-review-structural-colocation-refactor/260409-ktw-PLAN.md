---
phase: quick
plan: 260409-ktw
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/jamo/rotation.ts
  - src/lib/jamo/rotation.test.ts
  - src/lib/jamo/composition.ts
  - src/lib/jamo/jamo-data.ts
  - src/lib/jamo/jamo-data.test.ts
  - src/lib/character/character.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "rotation.ts owns its own data (ROTATION_SETS, ROTATION_MAP) — no import from jamo-data for these"
    - "composition.ts owns its own data (COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, CombinationRule, combinationOf) — no import from jamo-data for these"
    - "jamo-data.ts contains only index tables and their BY_INDEX reverses"
    - "getRotationOptions is gone from rotation.ts and rotation.test.ts"
    - "getNextRotation accepts Jamo (not string)"
    - "rotation.test.ts uses it.each for all getNextRotation cases"
    - "jamo-data.test.ts JUNGSEONG_INDEX tests use it.each table pattern"
    - "pnpm test passes with zero failures"
  artifacts:
    - path: "src/lib/jamo/rotation.ts"
      provides: "ROTATION_SETS, ROTATION_MAP inline; getNextRotation(jamo: Jamo)"
    - path: "src/lib/jamo/composition.ts"
      provides: "CombinationRule type, COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, combinationOf inline"
    - path: "src/lib/jamo/jamo-data.ts"
      provides: "CHOSEONG_INDEX/BY_INDEX, JUNGSEONG_INDEX/BY_INDEX, JONGSEONG_INDEX/BY_INDEX only"
    - path: "src/lib/character/character.ts"
      provides: "imports COMBINATION_RULES from composition (not jamo-data)"
  key_links:
    - from: "src/lib/character/character.ts"
      to: "src/lib/jamo/composition.ts"
      via: "import { COMBINATION_RULES }"
    - from: "src/lib/jamo/jamo-data.test.ts"
      to: "src/lib/jamo/rotation.ts"
      via: "import { ROTATION_SETS, ROTATION_MAP }"
    - from: "src/lib/jamo/jamo-data.test.ts"
      to: "src/lib/jamo/composition.ts"
      via: "import { COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, combinationOf }"
---

<objective>
PR review batch 1: colocate data with the functions that own it, remove the unused
getRotationOptions function, tighten the getNextRotation parameter type, and refactor
two test suites to table-driven style.

Purpose: After this batch, jamo-data.ts is a pure index table file. rotation.ts and
composition.ts each own their data. Tests are DRY and consistent.
Output: Modified source and test files; pnpm test green.
</objective>

<execution_context>
@/workspaces/binglebingle/.claude/get-shit-done/workflows/execute-plan.md
@/workspaces/binglebingle/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/workspaces/binglebingle/.planning/STATE.md
@/workspaces/binglebingle/src/lib/jamo/jamo-data.ts
@/workspaces/binglebingle/src/lib/jamo/rotation.ts
@/workspaces/binglebingle/src/lib/jamo/rotation.test.ts
@/workspaces/binglebingle/src/lib/jamo/composition.ts
@/workspaces/binglebingle/src/lib/jamo/types.ts
@/workspaces/binglebingle/src/lib/jamo/jamo-data.test.ts
@/workspaces/binglebingle/src/lib/character/character.ts

<interfaces>
<!-- Key contracts the executor needs. Extracted from codebase. -->

From src/lib/jamo/types.ts:
```typescript
export type ConsonantJamo = "ㄱ" | "ㄴ" | ... ;  // all consonants including double + compound batchim
export type VowelJamo = "ㅏ" | "ㅑ" | ... ;       // all vowels including complex vowels
export type Jamo = ConsonantJamo | VowelJamo;
```

From src/lib/jamo/jamo-data.ts (what stays after the move):
```typescript
export const CHOSEONG_INDEX: Readonly<Record<string, number>>
export const CHOSEONG_BY_INDEX: Readonly<Record<number, string>>
export const JUNGSEONG_INDEX: Readonly<Record<string, number>>
export const JUNGSEONG_BY_INDEX: Readonly<Record<number, string>>
export const JONGSEONG_INDEX: Readonly<Record<string, number>>
export const JONGSEONG_BY_INDEX: Readonly<Record<number, string>>
```

From src/lib/jamo/jamo-data.ts (what moves to rotation.ts):
```typescript
export const ROTATION_SETS: readonly (readonly string[])[]
export const ROTATION_MAP: ReadonlyMap<string, readonly string[]>
```

From src/lib/jamo/jamo-data.ts (what moves to composition.ts):
```typescript
export type CombinationRule = { inputs: readonly [string, string]; output: string; kind: "DOUBLE_CONSONANT" | "COMPLEX_VOWEL" | "COMPOUND_BATCHIM" }
export const COMBINATION_RULES: readonly CombinationRule[]
export const COMBINATION_MAP: ReadonlyMap<string, CombinationRule>
export const JONGSEONG_UPGRADE_MAP: ReadonlyMap<string, string>
export function combinationOf(a: string, b: string): CombinationRule | undefined
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Colocate data — move rotation data to rotation.ts, combination data to composition.ts, update all imports</name>
  <files>
    src/lib/jamo/rotation.ts
    src/lib/jamo/composition.ts
    src/lib/jamo/jamo-data.ts
    src/lib/character/character.ts
  </files>
  <action>
**rotation.ts** — move data in and update parameter type:
1. Remove the `import { ROTATION_MAP, ROTATION_SETS } from "./jamo-data"` line.
2. Paste ROTATION_SETS and ROTATION_MAP (with their JSDoc comments) directly into rotation.ts before the function definitions. Keep them exported so jamo-data.test.ts can import them from their new home.
3. Add `import type { Jamo } from "./types"` at the top.
4. Change `getNextRotation(jamo: string)` to `getNextRotation(jamo: Jamo)`.
5. Remove the `getRotationOptions` function entirely (it is unused in production code).

**composition.ts** — move data in:
1. Remove `COMBINATION_MAP, JONGSEONG_UPGRADE_MAP` from the import line (those move to this file).
2. Add `import type { CombinationRule } from "./jamo-data"` ONLY if CombinationRule is not moved. But it IS moved here — so: delete the jamo-data import entirely and keep only `CHOSEONG_BY_INDEX, CHOSEONG_INDEX, JONGSEONG_BY_INDEX, JONGSEONG_INDEX, JUNGSEONG_BY_INDEX, JUNGSEONG_INDEX` from jamo-data.
3. Paste CombinationRule type, COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, and combinationOf (with all their JSDoc comments) directly into composition.ts after the SYLLABLE_BASE constant and before the exported functions. Keep them all exported.

**jamo-data.ts** — remove the moved items:
1. Delete: CombinationRule type definition
2. Delete: ROTATION_SETS constant
3. Delete: ROTATION_MAP constant
4. Delete: COMBINATION_RULES constant
5. Delete: COMBINATION_MAP constant
6. Delete: combinationOf function
7. Delete: JONGSEONG_UPGRADE_MAP constant
8. Update the file-level JSDoc comment to reflect that the file now contains only index tables.
9. The six index tables (CHOSEONG_INDEX, CHOSEONG_BY_INDEX, JUNGSEONG_INDEX, JUNGSEONG_BY_INDEX, JONGSEONG_INDEX, JONGSEONG_BY_INDEX) remain exactly as-is.

**character.ts** — fix the stale import:
1. Change `import { COMBINATION_RULES } from "../jamo/jamo-data"` to `import { COMBINATION_RULES } from "../jamo/composition"`.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm tsc --noEmit 2>&1 | head -40</automated>
  </verify>
  <done>TypeScript compiles with zero errors. rotation.ts has no jamo-data import. composition.ts has no CombinationRule/COMBINATION_RULES/etc. import from jamo-data. character.ts imports COMBINATION_RULES from composition. jamo-data.ts exports only the six index tables.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor rotation.test.ts — remove getRotationOptions tests, table-drive getNextRotation</name>
  <files>
    src/lib/jamo/rotation.test.ts
  </files>
  <action>
Rewrite rotation.test.ts entirely (it is short — 45 lines):

1. Remove the `getRotationOptions` import (it no longer exists) and the entire `describe("getRotationOptions", ...)` block (4 tests).

2. Refactor the `describe("getNextRotation", ...)` block into two `it.each` tables:

**Table A — rotatable jamo (all cases including wrap-around):**
```typescript
const ROTATABLE_CASES: [string, string, string][] = [
  // [description, input, expected]
  ["ㄱ→ㄴ (consonant set)", "ㄱ", "ㄴ"],
  ["ㄴ→ㄱ (wrap-around in 2-set)", "ㄴ", "ㄱ"],
  ["ㅏ→ㅜ (first of 4-set, clockwise)", "ㅏ", "ㅜ"],
  ["ㅜ→ㅓ (index 1→2 in clockwise set)", "ㅜ", "ㅓ"],
  ["ㅓ→ㅗ (index 2→3)", "ㅓ", "ㅗ"],
  ["ㅗ→ㅏ (wrap-around in 4-set)", "ㅗ", "ㅏ"],
  ["ㅣ→ㅡ (first of 2-set)", "ㅣ", "ㅡ"],
  ["ㅡ→ㅣ (wrap-around in 2-set)", "ㅡ", "ㅣ"],
  ["ㅑ→ㅠ (first of extended 4-set)", "ㅑ", "ㅠ"],
  ["ㅛ→ㅑ (wrap-around in extended 4-set)", "ㅛ", "ㅑ"],
];

it.each(ROTATABLE_CASES)("%s", (_desc, input, expected) => {
  expect(getNextRotation(input as Jamo)).toBe(expected);
});
```

**Table B — non-rotatable jamo (returns null):**
```typescript
const NON_ROTATABLE: string[] = ["ㅎ", "ㅊ", "ㅂ", "ㄷ", "ㅁ"];

it.each(NON_ROTATABLE)("returns null for non-rotatable jamo %s", (jamo) => {
  expect(getNextRotation(jamo as Jamo)).toBeNull();
});
```

Import `Jamo` type from `./types` for the cast. Keep `describe("getNextRotation", ...)` wrapper. Result: ~45 lines, two `it.each` blocks, no individual `it(...)` calls.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test rotation.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>pnpm test rotation.test.ts passes. No getRotationOptions tests remain. getNextRotation suite has exactly two it.each blocks. All rotatable cases verified including all wrap-arounds.</done>
</task>

<task type="auto">
  <name>Task 3: Update jamo-data.test.ts — fix imports and refactor JUNGSEONG_INDEX to table-driven</name>
  <files>
    src/lib/jamo/jamo-data.test.ts
  </files>
  <action>
**Fix imports at the top of jamo-data.test.ts:**

The test file currently imports ROTATION_SETS, ROTATION_MAP, COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, and combinationOf from `"./jamo-data"`. Those exports have moved. Update imports:

```typescript
import {
  CHOSEONG_INDEX,
  CHOSEONG_BY_INDEX,
  JUNGSEONG_INDEX,
  JUNGSEONG_BY_INDEX,
  JONGSEONG_INDEX,
  JONGSEONG_BY_INDEX,
} from "./jamo-data";

import { ROTATION_SETS, ROTATION_MAP } from "./rotation";

import {
  COMBINATION_RULES,
  COMBINATION_MAP,
  JONGSEONG_UPGRADE_MAP,
  combinationOf,
} from "./composition";
```

**Refactor JUNGSEONG_INDEX tests (lines 58–75) to table-driven:**

Replace the two individual `it(...)` tests and the loop-based codepoint test with a single `it.each` pattern matching CHOSEONG_INDEX:

```typescript
describe("JUNGSEONG_INDEX", () => {
  it("contains exactly 21 entries", () => {
    expect(Object.keys(JUNGSEONG_INDEX).length).toBe(21);
  });

  const EXPECTED_JUNGSEONG: [string, number][] = [
    ["ㅏ", 0],
    ["ㅐ", 1],
    ["ㅑ", 2],
    ["ㅒ", 3],
    ["ㅓ", 4],
    ["ㅔ", 5],
    ["ㅕ", 6],
    ["ㅖ", 7],
    ["ㅗ", 8],
    ["ㅘ", 9],
    ["ㅙ", 10],
    ["ㅚ", 11],
    ["ㅛ", 12],
    ["ㅜ", 13],
    ["ㅝ", 14],
    ["ㅞ", 15],
    ["ㅟ", 16],
    ["ㅠ", 17],
    ["ㅡ", 18],
    ["ㅢ", 19],
    ["ㅣ", 20],
  ];

  it.each(EXPECTED_JUNGSEONG)("maps %s to %i and uses Compatibility Jamo codepoint", (jamo, idx) => {
    expect(JUNGSEONG_INDEX[jamo]).toBe(idx);
    expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
    expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
  });
});
```

Leave JUNGSEONG_BY_INDEX, JONGSEONG_INDEX (already table-driven), and all other describe blocks exactly as they are.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test jamo-data.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>pnpm test jamo-data.test.ts passes with all assertions green. JUNGSEONG_INDEX suite uses it.each. Imports resolve to their new module locations.</done>
</task>

</tasks>

<verification>
Full test suite passes:

```bash
cd /workspaces/binglebingle && pnpm test 2>&1 | tail -30
```

TypeScript compilation is clean:

```bash
cd /workspaces/binglebingle && pnpm tsc --noEmit
```

Verify jamo-data.ts has no rotation or combination exports remaining:

```bash
grep -n "ROTATION\|COMBINATION\|combinationOf\|CombinationRule\|JONGSEONG_UPGRADE" /workspaces/binglebingle/src/lib/jamo/jamo-data.ts
```
(should return nothing)

Verify character.ts imports COMBINATION_RULES from composition:

```bash
grep "COMBINATION_RULES" /workspaces/binglebingle/src/lib/character/character.ts
```
(should show `from "../jamo/composition"`)
</verification>

<success_criteria>
- jamo-data.ts contains only the six index/reverse-index tables
- rotation.ts owns ROTATION_SETS and ROTATION_MAP; getNextRotation parameter is Jamo; getRotationOptions is deleted
- composition.ts owns CombinationRule, COMBINATION_RULES, COMBINATION_MAP, JONGSEONG_UPGRADE_MAP, combinationOf
- character.ts imports COMBINATION_RULES from composition
- rotation.test.ts has two it.each blocks for getNextRotation; no getRotationOptions tests
- jamo-data.test.ts JUNGSEONG_INDEX uses it.each table; imports split across jamo-data/rotation/composition
- pnpm test passes with zero failures
- pnpm tsc --noEmit exits 0
</success_criteria>

<output>
After completion, create `.planning/quick/260409-ktw-pr-review-structural-colocation-refactor/260409-ktw-SUMMARY.md`
</output>
