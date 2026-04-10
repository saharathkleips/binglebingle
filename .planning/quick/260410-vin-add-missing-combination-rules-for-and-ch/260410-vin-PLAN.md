---
phase: quick-260410-vin
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/jamo/composition.ts
  - src/lib/jamo/composition.test.ts
  - src/lib/character/character.test.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "composeJamo('ㅘ', 'ㅣ') returns 'ㅙ'"
    - "composeJamo('ㅝ', 'ㅣ') returns 'ㅞ'"
    - "decomposeJamo('ㅙ') still returns ['ㅗ', 'ㅐ'] (canonical path preserved)"
    - "decomposeJamo('ㅞ') still returns ['ㅜ', 'ㅔ'] (canonical path preserved)"
    - "compose({ jungseong: 'ㅘ' }, { jungseong: 'ㅣ' }) returns { jungseong: 'ㅙ' }"
    - "compose({ jungseong: 'ㅝ' }, { jungseong: 'ㅣ' }) returns { jungseong: 'ㅞ' }"
    - "All existing tests continue to pass"
  artifacts:
    - path: "src/lib/jamo/composition.ts"
      provides: "COMBINATION_RULES with two new COMPLEX_VOWEL entries"
      contains: "ㅘ.*ㅣ.*ㅙ"
    - path: "src/lib/jamo/composition.test.ts"
      provides: "Tests for new combination paths and canonical decompose verification"
    - path: "src/lib/character/character.test.ts"
      provides: "Tests for compose() using new vowel combination paths"
  key_links:
    - from: "COMBINATION_RULES (new entries)"
      to: "COMBINATION_MAP"
      via: "flatMap at module load — new entries add ㅘ|ㅣ and ㅣ|ㅘ keys (commutative)"
    - from: "COMBINATION_RULES (new entries)"
      to: "DECOMPOSE_MAP"
      via: "Map built from COMBINATION_RULES.map() — duplicate output keys; new entries MUST appear BEFORE existing canonical entries so canonical entries win as last entry"
---

<objective>
Add ㅘ+ㅣ→ㅙ and ㅝ+ㅣ→ㅞ as alternative combination paths in COMBINATION_RULES. The canonical decompose paths (ㅙ→ㅗ+ㅐ and ㅞ→ㅜ+ㅔ) are preserved. Add test coverage for both the new combination paths and the canonical decompose behavior.

Purpose: Players who build ㅘ from ㅗ+ㅏ can then add ㅣ to reach ㅙ; same for ㅝ+ㅣ→ㅞ. Without these rules, those input paths dead-end.
Output: Updated composition.ts with 2 new rules, updated test files with explicit coverage.
</objective>

<execution_context>
@/workspaces/binglebingle/.claude/get-shit-done/workflows/execute-plan.md
@/workspaces/binglebingle/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/lib/jamo/composition.ts
@src/lib/jamo/composition.test.ts
@src/lib/character/character.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add ㅘ+ㅣ→ㅙ and ㅝ+ㅣ→ㅞ to COMBINATION_RULES</name>
  <files>src/lib/jamo/composition.ts</files>
  <behavior>
    - composeJamo('ㅘ', 'ㅣ') === 'ㅙ'
    - composeJamo('ㅣ', 'ㅘ') === 'ㅙ' (commutative — COMBINATION_MAP adds both orders)
    - composeJamo('ㅝ', 'ㅣ') === 'ㅞ'
    - composeJamo('ㅣ', 'ㅝ') === 'ㅞ' (commutative)
    - decomposeJamo('ㅙ') still returns ['ㅗ', 'ㅐ'] (not ['ㅘ', 'ㅣ'])
    - decomposeJamo('ㅞ') still returns ['ㅜ', 'ㅔ'] (not ['ㅝ', 'ㅣ'])
  </behavior>
  <action>
    In `COMBINATION_RULES` inside `src/lib/jamo/composition.ts`, insert two new COMPLEX_VOWEL entries for the alternative vowel paths. The entries must be placed BEFORE the existing canonical entries for ㅙ and ㅞ, because `DECOMPOSE_MAP` is built via `COMBINATION_RULES.map(rule => [rule.output, rule.inputs])` and passed to `new Map()` — when duplicate keys exist, Map retains the LAST value. The canonical entries (`ㅗ+ㅐ→ㅙ` and `ㅜ+ㅔ→ㅞ`) must appear last so they win.

    Concretely, in the "Complex vowels (11)" block:
    - Add `{ inputs: ["ㅘ", "ㅣ"], output: "ㅙ", kind: "COMPLEX_VOWEL" }` immediately before the existing `{ inputs: ["ㅗ", "ㅐ"], output: "ㅙ", kind: "COMPLEX_VOWEL" }` line
    - Add `{ inputs: ["ㅝ", "ㅣ"], output: "ㅞ", kind: "COMPLEX_VOWEL" }` immediately before the existing `{ inputs: ["ㅜ", "ㅔ"], output: "ㅞ", kind: "COMPLEX_VOWEL" }` line

    Update the comment from "Complex vowels (11)" to "Complex vowels (13)" since the count increases by 2.

    No other changes needed — COMBINATION_MAP and DECOMPOSE_MAP are derived at module load from COMBINATION_RULES automatically.
  </action>
  <verify>
    <automated>pnpm test --reporter=verbose src/lib/jamo/composition.test.ts</automated>
  </verify>
  <done>
    - COMBINATION_RULES has 29 entries (was 27)
    - composeJamo('ㅘ', 'ㅣ') and composeJamo('ㅝ', 'ㅣ') both return the correct output
    - decomposeJamo('ㅙ') returns ['ㅗ', 'ㅐ'] and decomposeJamo('ㅞ') returns ['ㅜ', 'ㅔ']
    - All existing composition tests pass
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add test cases for new paths in composition.test.ts and character.test.ts</name>
  <files>src/lib/jamo/composition.test.ts, src/lib/character/character.test.ts</files>
  <behavior>
    composition.test.ts:
    - The existing `composeJamo — all COMBINATION_RULES` suite auto-covers new rules via COMBINATION_RULES iteration (no change needed there)
    - Add explicit `decomposeJamo` canonical-path tests: decomposeJamo('ㅙ') → ['ㅗ', 'ㅐ'], decomposeJamo('ㅞ') → ['ㅜ', 'ㅔ'] (not the new alternate inputs)
    - Add explicit `composeJamo` tests for the new alternate paths: composeJamo('ㅘ', 'ㅣ') → 'ㅙ', composeJamo('ㅣ', 'ㅘ') → 'ㅙ', composeJamo('ㅝ', 'ㅣ') → 'ㅞ', composeJamo('ㅣ', 'ㅝ') → 'ㅞ'

    character.test.ts:
    - In the `compose` describe block, under "Jungseong-only target: complex vowel combinations", extend the existing it.each table with:
      - ['ㅘ', 'ㅣ', 'ㅙ'] — new alternative path
      - ['ㅝ', 'ㅣ', 'ㅞ'] — new alternative path
    - In the `compose` describe block, add a case for choseong+jungseong target combining via new path:
      - compose({ choseong: 'ㅎ', jungseong: 'ㅘ' }, { jungseong: 'ㅣ' }) → { choseong: 'ㅎ', jungseong: 'ㅙ' }
  </behavior>
  <action>
    In `src/lib/jamo/composition.test.ts`:

    1. Add a new describe block "decomposeJamo — canonical paths for alternate-input vowels" with two explicit it() tests:
       - `expect(decomposeJamo('ㅙ')).toEqual(['ㅗ', 'ㅐ'])` with a comment "canonical path, not alternate ['ㅘ', 'ㅣ']"
       - `expect(decomposeJamo('ㅞ')).toEqual(['ㅜ', 'ㅔ'])` with a comment "canonical path, not alternate ['ㅝ', 'ㅣ']"

    2. Add a new describe block "composeJamo — alternate input paths" with four explicit it() tests covering ㅘ+ㅣ, ㅣ+ㅘ, ㅝ+ㅣ, ㅣ+ㅝ.

    In `src/lib/character/character.test.ts`:

    1. In the existing `it.each` for "jungseong+jungseong", extend the array with two new rows: `["ㅘ", "ㅣ", "ㅙ"]` and `["ㅝ", "ㅣ", "ㅞ"]` (typed as `[VowelJamo, VowelJamo, VowelJamo]`).

    2. Add a new standalone `it()` test in the "choseong+jungseong target" section:
       `compose({ choseong: 'ㅎ', jungseong: 'ㅘ' }, { jungseong: 'ㅣ' })` → `{ choseong: 'ㅎ', jungseong: 'ㅙ' }`
  </action>
  <verify>
    <automated>pnpm test --reporter=verbose src/lib/jamo/composition.test.ts src/lib/character/character.test.ts</automated>
  </verify>
  <done>
    - New decomposeJamo canonical-path tests pass
    - New composeJamo alternate-path tests pass
    - Extended it.each rows in character.test.ts pass
    - New choseong+jungseong alternate-path test passes
    - Full test suite: pnpm test passes with zero failures
  </done>
</task>

</tasks>

<verification>
Run full test suite to confirm nothing regressed:

```
pnpm test
```

All tests pass. TypeScript build clean:

```
pnpm tsc --noEmit
```
</verification>

<success_criteria>
- COMBINATION_RULES has 29 entries (added ㅘ+ㅣ→ㅙ and ㅝ+ㅣ→ㅞ)
- composeJamo('ㅘ', 'ㅣ') → 'ㅙ' and composeJamo('ㅝ', 'ㅣ') → 'ㅞ' (both commutative directions work)
- decomposeJamo('ㅙ') → ['ㅗ', 'ㅐ'] and decomposeJamo('ㅞ') → ['ㅜ', 'ㅔ'] (canonical paths unchanged)
- pnpm test passes with zero failures
</success_criteria>

<output>
After completion, create `.planning/quick/260410-vin-add-missing-combination-rules-for-and-ch/260410-vin-SUMMARY.md`
</output>
