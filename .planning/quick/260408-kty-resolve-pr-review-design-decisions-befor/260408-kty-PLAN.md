---
phase: quick
plan: 260408-kty
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/jamo/jamo-data.ts
  - src/lib/jamo/jamo-data.test.ts
  - src/lib/jamo/types.ts
  - src/lib/character/types.ts
  - src/lib/character/character.ts
  - src/lib/jamo/composition.ts
  - src/lib/jamo/composition.test.ts
  - src/lib/jamo/rotation.ts
  - src/lib/jamo/rotation.test.ts
  - src/lib/jamo/README.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "All 17 PR review comments are addressed with no regressions"
    - "Rotation sets use the correct clockwise vowel order"
    - "CombinationRule has a single unified kind with SCREAMING_SNAKE_CASE literals"
    - "Jamo type lives in jamo/ domain, split into ConsonantJamo | VowelJamo"
    - "combinationOf(a, b) public API exists and returns CombinationRule | undefined"
    - "All tests pass including new table-driven cases"
  artifacts:
    - path: "src/lib/jamo/types.ts"
      provides: "ConsonantJamo, VowelJamo, Jamo union types"
      exports: ["ConsonantJamo", "VowelJamo", "Jamo"]
    - path: "src/lib/jamo/jamo-data.ts"
      provides: "Unified CombinationRule type, colocated reverse-lookup maps, combinationOf helper"
      contains: "COMPOUND_BATCHIM"
    - path: "src/lib/character/types.ts"
      provides: "Character using ConsonantJamo and VowelJamo from jamo/"
  key_links:
    - from: "src/lib/character/types.ts"
      to: "src/lib/jamo/types.ts"
      via: "import type { ConsonantJamo, VowelJamo, Jamo }"
      pattern: "from.*jamo/types"
    - from: "src/lib/character/character.ts"
      to: "src/lib/jamo/types.ts"
      via: "import type { Jamo }"
      pattern: "from.*jamo/types"
    - from: "src/lib/jamo/composition.ts"
      to: "src/lib/jamo/jamo-data.ts"
      via: "import CHOSEONG_BY_INDEX etc (now from jamo-data)"
      pattern: "CHOSEONG_BY_INDEX|JUNGSEONG_BY_INDEX|JONGSEONG_BY_INDEX"
---

<objective>
Implement all 17 PR review comments on the gsd/phase-02-jamo-core branch.

Purpose: Address reviewer feedback before merging jamo phase code — correct rotation ordering, unify type hierarchy, improve test coverage, add ergonomic API wrapper, and fix documentation.
Output: Updated jamo-data.ts, jamo/types.ts (new), character/types.ts, composition.ts, rotation.ts, and all test files; README.md corrected.
</objective>

<execution_context>
@/workspaces/binglebingle/.claude/get-shit-done/workflows/execute-plan.md
@/workspaces/binglebingle/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/quick/260408-kty-resolve-pr-review-design-decisions-befor/260408-kty-CONTEXT.md

<interfaces>
<!-- Key types and functions the executor needs for context. Extracted from codebase. -->

From src/lib/jamo/jamo-data.ts (current — will be changed):
```typescript
// Current (wrong) kind literals — will become SCREAMING_SNAKE_CASE
export type CombinationRule = {
  readonly inputs: readonly [string, string];
  readonly output: string;
  readonly kind: "doubleConsonant" | "complexVowel";  // MUST become "DOUBLE_CONSONANT" | "COMPLEX_VOWEL" | "COMPOUND_BATCHIM"
};

// Separate type — MUST be merged into CombinationRule
export type JongseongUpgradeRule = {
  readonly existing: string;
  readonly additional: string;
  readonly output: string;
};

// Current (wrong) rotation order — MUST be fixed:
// ["ㅏ", "ㅓ", "ㅗ", "ㅜ"] → ["ㅏ", "ㅜ", "ㅓ", "ㅗ"]
// ["ㅑ", "ㅕ", "ㅛ", "ㅠ"] → ["ㅑ", "ㅠ", "ㅕ", "ㅛ"]
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],  // WRONG ORDER
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅕ", "ㅛ", "ㅠ"],  // WRONG ORDER
];
```

From src/lib/jamo/composition.ts (reverse-lookup maps to move to jamo-data.ts):
```typescript
// These three maps must move TO jamo-data.ts and be exported
const CHOSEONG_BY_INDEX: Record<number, string> = Object.fromEntries(...);
const JUNGSEONG_BY_INDEX: Record<number, string> = Object.fromEntries(...);
const JONGSEONG_BY_INDEX: Record<number, string> = Object.fromEntries(...);
```

From src/lib/character/types.ts (Jamo type to move to jamo/types.ts):
```typescript
export type Jamo = "ㄱ" | "ㄴ" | ... // full union, move to jamo/types.ts
export type Character = {
  choseong?: Jamo;     // will become ConsonantJamo
  jungseong?: Jamo;    // will become VowelJamo
  jongseong?: Jamo;    // will become ConsonantJamo
};
```

From src/lib/character/character.ts:
```typescript
import type { Character, Jamo } from "./types";  // must update to import Jamo from jamo/types
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unify jamo-data.ts — type merge, rotation fix, colocate maps, combinationOf, JSDoc</name>
  <files>
    src/lib/jamo/jamo-data.ts,
    src/lib/jamo/jamo-data.test.ts
  </files>
  <action>
    Rewrite src/lib/jamo/jamo-data.ts with all of the following changes (reviews [2][3][4][5][6 maps][14][15]):

    **[5] SCREAMING_SNAKE_CASE kind literals:**
    Change CombinationRule.kind from `"doubleConsonant" | "complexVowel"` to `"DOUBLE_CONSONANT" | "COMPLEX_VOWEL" | "COMPOUND_BATCHIM"`.

    **[4] Merge JongseongUpgradeRule into CombinationRule:**
    - Remove the `JongseongUpgradeRule` type entirely.
    - The JONGSEONG_UPGRADE_RULES array items become CombinationRule entries with `kind: "COMPOUND_BATCHIM"` and `inputs: [existing, additional]`.
    - Merge them INTO `COMBINATION_RULES` array (append at end after existing 16 entries — now 27 total).
    - Keep `COMBINATION_MAP` building from COMBINATION_RULES — but ONLY for DOUBLE_CONSONANT and COMPLEX_VOWEL rules (sorted key, commutative). The COMPOUND_BATCHIM rules go into a separate derived map.
    - Keep `JONGSEONG_UPGRADE_MAP` as a derived map from the COMPOUND_BATCHIM subset of COMBINATION_RULES (key: `existing|additional` — unsorted, NOT commutative). This preserves the existing lookup semantics without breaking callers.
    - Export: `COMBINATION_RULES` (all 27), `COMBINATION_MAP` (16 entries, DOUBLE_CONSONANT + COMPLEX_VOWEL only), `JONGSEONG_UPGRADE_MAP` (11 entries, COMPOUND_BATCHIM only, key format unchanged).
    - Remove `JONGSEONG_UPGRADE_RULES` export (replaced by filtering COMBINATION_RULES where kind === "COMPOUND_BATCHIM").

    **[2][3] Fix rotation order:**
    Update ROTATION_SETS vowel arrays to the correct clockwise order:
    - `["ㅏ", "ㅓ", "ㅗ", "ㅜ"]` → `["ㅏ", "ㅜ", "ㅓ", "ㅗ"]`
    - `["ㅑ", "ㅕ", "ㅛ", "ㅠ"]` → `["ㅑ", "ㅠ", "ㅕ", "ㅛ"]`

    **[6] Colocate reverse-lookup maps:**
    Move these three maps from composition.ts into jamo-data.ts and export them:
    ```typescript
    export const CHOSEONG_BY_INDEX: Readonly<Record<number, string>> = Object.fromEntries(
      Object.entries(CHOSEONG_INDEX).map(([k, v]) => [v, k]),
    );
    export const JUNGSEONG_BY_INDEX: Readonly<Record<number, string>> = Object.fromEntries(
      Object.entries(JUNGSEONG_INDEX).map(([k, v]) => [v, k]),
    );
    export const JONGSEONG_BY_INDEX: Readonly<Record<number, string>> = Object.fromEntries(
      Object.entries(JONGSEONG_INDEX).map(([k, v]) => [v, k]),
    );
    ```
    Place them immediately after the index tables they derive from (after JONGSEONG_INDEX).

    **[14] combinationOf wrapper:**
    Add this exported function after COMBINATION_MAP:
    ```typescript
    /**
     * Returns the CombinationRule for two jamo if one exists, or undefined.
     * Handles DOUBLE_CONSONANT and COMPLEX_VOWEL combinations (commutative).
     * Does NOT handle COMPOUND_BATCHIM — use JONGSEONG_UPGRADE_MAP for that.
     *
     * @param a - First Hangul Compatibility Jamo string
     * @param b - Second Hangul Compatibility Jamo string
     */
    export function combinationOf(a: string, b: string): CombinationRule | undefined {
      const key = [a, b].sort().join("|");
      return COMBINATION_MAP.get(key);
    }
    ```

    **[15] JSDoc on index tables:**
    Improve the JSDoc on CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX to clarify these are UAX #15 ordinals for syllable block composition arithmetic, NOT Unicode codepoint values. Example addition (keep concise, 1 sentence):
    "These ordinals are used in UAX #15 syllable block arithmetic (codepoint = 0xAC00 + cho*21*28 + jung*28 + jong) — they are NOT Unicode codepoint offsets."

    **Update jamo-data.test.ts per [11][12][13]:**
    - [11] CHOSEONG_INDEX test: replace "maps ㄱ to 0 and ㅎ to 18" with a table-driven test checking all 19 entries. Also combine the compatibility jamo codepoint test inline (assert each key's codepoint is in 0x3130–0x318F). Example pattern:
      ```typescript
      const EXPECTED_CHOSEONG: [string, number][] = [["ㄱ", 0], ["ㄲ", 1], ["ㄴ", 2], ..., ["ㅎ", 18]];
      it.each(EXPECTED_CHOSEONG)("maps %s to %i", (jamo, idx) => {
        expect(CHOSEONG_INDEX[jamo]).toBe(idx);
        expect(jamo.codePointAt(0)).toBeGreaterThanOrEqual(0x3130);
        expect(jamo.codePointAt(0)).toBeLessThanOrEqual(0x318f);
      });
      ```
      Remove the now-redundant separate "all keys use Hangul Compatibility Jamo codepoints" test.
    - [12] Apply the same table-driven pattern to JONGSEONG_INDEX (28 entries including `""` → 0). Combine the "maps the empty string to 0" and compatibility jamo codepoint tests. Keep "does not include ㄸ, ㅃ, ㅉ" as a separate test (still valid).
    - [13] Test all COMBINATION_RULES (now 27) — replace the sparse lookup tests with a table-driven test that verifies every rule: for each rule in COMBINATION_RULES, assert that looking it up via the correct map returns the expected output. COMPOUND_BATCHIM rules use JONGSEONG_UPGRADE_MAP with unsorted key `existing|additional`; DOUBLE_CONSONANT and COMPLEX_VOWEL rules use COMBINATION_MAP with sorted key.
    - Update any test that imports `JONGSEONG_UPGRADE_RULES` — replace with `COMBINATION_RULES.filter(r => r.kind === "COMPOUND_BATCHIM")`. Remove import of the now-deleted `JONGSEONG_UPGRADE_RULES`.
    - Update the COMBINATION_RULES count test: "contains exactly 16 rules" → "contains exactly 27 rules".
    - Update the "has no duplicate input pairs" test to only check DOUBLE_CONSONANT and COMPLEX_VOWEL rules (since COMPOUND_BATCHIM are intentionally non-sorted).
    - Update the ROTATION_MAP tests to reflect new rotation order: `getRotationOptions("ㅏ")` now returns `["ㅜ", "ㅓ", "ㅗ"]` not `["ㅓ", "ㅗ", "ㅜ"]`.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test -- --reporter=verbose src/lib/jamo/jamo-data.test.ts 2>&1 | tail -30</automated>
  </verify>
  <done>
    All jamo-data tests pass. COMBINATION_RULES has 27 entries. JONGSEONG_UPGRADE_RULES export is removed. COMBINATION_MAP has 16 entries (DOUBLE_CONSONANT + COMPLEX_VOWEL). JONGSEONG_UPGRADE_MAP has 11 entries. combinationOf is exported. Rotation sets have correct clockwise vowel order. Reverse-lookup maps (CHOSEONG_BY_INDEX, JUNGSEONG_BY_INDEX, JONGSEONG_BY_INDEX) are exported from jamo-data.ts.
  </done>
</task>

<task type="auto">
  <name>Task 2: Move and split Jamo type — jamo/types.ts + character/types.ts + character.ts imports</name>
  <files>
    src/lib/jamo/types.ts,
    src/lib/character/types.ts,
    src/lib/character/character.ts
  </files>
  <action>
    Implement review comment [17]: Move Jamo type from character/ to jamo/ domain and split into sub-unions.

    **Create src/lib/jamo/types.ts (new file):**
    ```typescript
    /**
     * @file types.ts
     *
     * Jamo type definitions for the jamo domain.
     * All literals use Hangul Compatibility Jamo (U+3130–U+318F).
     */

    /**
     * Every valid consonant jamo the game can produce or place in choseong/jongseong slots.
     * Includes basic consonants, double consonants (choseong only), and compound batchim (jongseong only).
     */
    export type ConsonantJamo =
      // Basic consonants
      | "ㄱ" | "ㄴ" | "ㄷ" | "ㄹ" | "ㅁ" | "ㅂ" | "ㅅ" | "ㅇ" | "ㅈ" | "ㅊ" | "ㅋ" | "ㅌ" | "ㅍ" | "ㅎ"
      // Double consonants (choseong only — ㄸ ㅃ ㅉ are not valid jongseong)
      | "ㄲ" | "ㄸ" | "ㅃ" | "ㅆ" | "ㅉ"
      // Compound batchim (jongseong only)
      | "ㄳ" | "ㄵ" | "ㄶ" | "ㄺ" | "ㄻ" | "ㄼ" | "ㄽ" | "ㄾ" | "ㄿ" | "ㅀ" | "ㅄ";

    /**
     * Every valid vowel jamo the game can produce or place in the jungseong slot.
     * Includes basic vowels and complex vowels (outputs of COMBINATION_RULES).
     */
    export type VowelJamo =
      // Basic vowels
      | "ㅏ" | "ㅑ" | "ㅓ" | "ㅕ" | "ㅗ" | "ㅛ" | "ㅜ" | "ㅠ" | "ㅡ" | "ㅣ"
      // Complex vowels
      | "ㅐ" | "ㅒ" | "ㅔ" | "ㅖ" | "ㅘ" | "ㅙ" | "ㅚ" | "ㅝ" | "ㅞ" | "ㅟ" | "ㅢ";

    /**
     * Every valid Hangul Compatibility Jamo (U+3130–U+318F) that the game can produce.
     */
    export type Jamo = ConsonantJamo | VowelJamo;
    ```

    **Update src/lib/character/types.ts:**
    - Remove the `Jamo` type definition entirely.
    - Add import: `import type { ConsonantJamo, VowelJamo, Jamo } from "../jamo/types";`
    - Re-export `Jamo` for backward compatibility: `export type { Jamo }` (character.ts imports Jamo from here).
    - Update Character slots to use precise types:
      ```typescript
      export type Character = {
        choseong?: ConsonantJamo;
        jungseong?: VowelJamo;
        jongseong?: ConsonantJamo;
      };
      ```
    - Keep `export type { ConsonantJamo, VowelJamo }` so callers have access via character/types if needed.
    - Update the file JSDoc to note Jamo is defined in jamo/types.ts.

    **Update src/lib/character/character.ts:**
    - The import `import type { Character, Jamo } from "./types"` still works since character/types.ts re-exports Jamo.
    - No changes required to character.ts logic — the `as Jamo` casts remain valid. Verify tsc is happy after the types change.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm exec tsc --noEmit 2>&1 | head -40</automated>
  </verify>
  <done>
    src/lib/jamo/types.ts exists and exports ConsonantJamo, VowelJamo, Jamo. character/types.ts imports from jamo/types and uses ConsonantJamo/VowelJamo in Character slots. TypeScript compilation reports zero errors.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update composition.ts + rotation.ts + expand composition and rotation tests</name>
  <files>
    src/lib/jamo/composition.ts,
    src/lib/jamo/rotation.ts,
    src/lib/jamo/composition.test.ts,
    src/lib/jamo/rotation.test.ts
  </files>
  <action>
    **[6] Update composition.ts — import reverse-lookup maps from jamo-data:**
    Remove the three local const declarations (CHOSEONG_BY_INDEX, JUNGSEONG_BY_INDEX, JONGSEONG_BY_INDEX) from composition.ts since they are now exported from jamo-data.ts. Import them:
    ```typescript
    import {
      CHOSEONG_BY_INDEX,
      CHOSEONG_INDEX,
      COMBINATION_MAP,
      JONGSEONG_BY_INDEX,
      JONGSEONG_INDEX,
      JONGSEONG_UPGRADE_MAP,
      JUNGSEONG_BY_INDEX,
      JUNGSEONG_INDEX,
    } from "./jamo-data";
    ```
    All function bodies remain identical — only the source of the maps changes.

    **Update rotation.ts — no logic change needed**, but verify ROTATION_MAP still works correctly after the ROTATION_SETS order change in Task 1. The ROTATION_MAP derivation logic is unchanged; it will now produce the correct next-rotation values from the reordered sets.

    **[9][10] Expand composition.test.ts:**

    - [9] Add to the `decomposeSyllable` describe block:
      ```typescript
      it("returns null for multi-character string (not a single syllable)", () => {
        expect(decomposeSyllable("한국")).toBeNull();
      });
      ```
      Note: decomposeSyllable uses `codePointAt(0)` which only reads the first char, so the function won't actually return null for a multi-char string unless the first char isn't in the syllable block range. Check the actual behavior first — if `decomposeSyllable("한국")` returns the decomposition of "한" (not null), then the test should document that: `expect(decomposeSyllable("한국")).toStrictEqual({ choseong: "ㅎ", jungseong: "ㅏ", jongseong: "ㄴ" })` with a comment "reads only first char — multi-syllable inputs silently truncate". This documents the behavior for callers rather than asserting wrong behavior. Use whichever expectation matches actual function behavior.

    - [10] Convert composeSyllable tests to table-driven across more characters:
      ```typescript
      const COMPOSE_CASES: [string, string, string | undefined, string][] = [
        ["ㄱ", "ㅏ", undefined, "가"],
        ["ㅎ", "ㅏ", "ㄴ", "한"],
        ["ㅎ", "ㅞ", "ㄳ", "훿"],
        ["ㅇ", "ㅏ", undefined, "아"],
        ["ㄸ", "ㅏ", undefined, "따"],
        ["ㄴ", "ㅣ", undefined, "니"],
        ["ㅅ", "ㅓ", "ㄹ", "설"],
        ["ㅁ", "ㅜ", "ㄹ", "물"],
      ];
      it.each(COMPOSE_CASES)(
        "composeSyllable(%s, %s, %s) → %s",
        (cho, jung, jong, expected) => {
          expect(composeSyllable(cho, jung, jong)).toBe(expected);
        },
      );
      ```
      Keep the null-return tests (invalid jongseong ㅃ, consonant in jungseong position) as individual named tests for clarity.

    **[rotation.test.ts] Update getRotationOptions tests to reflect new clockwise order:**
    The test "returns members in set order for a multi-member set" currently asserts:
      `expect(getRotationOptions("ㅏ")).toStrictEqual(["ㅓ", "ㅗ", "ㅜ"])`
    Must become:
      `expect(getRotationOptions("ㅏ")).toStrictEqual(["ㅜ", "ㅓ", "ㅗ"])`
    Also update getNextRotation wrap test:
    - "wraps from last member back to first" asserts `getNextRotation("ㅜ")` → `"ㅏ"`. After reorder, ㅜ is at index 1 in `["ㅏ", "ㅜ", "ㅓ", "ㅗ"]`, so next is "ㅓ", not "ㅏ". Update:
      `expect(getNextRotation("ㅜ")).toBe("ㅓ")`
    - "returns the second member for the first member of a 4-set" asserts `getNextRotation("ㅏ")` → `"ㅓ"`. After reorder, second member is "ㅜ". Update:
      `expect(getNextRotation("ㅏ")).toBe("ㅜ")`
    - The wrap for ㄴ → ㄱ stays correct (2-element set unchanged).
    Also update wrap test for ㅗ: ㅗ is now last (index 3 in ["ㅏ","ㅜ","ㅓ","ㅗ"]), so `getNextRotation("ㅗ")` should wrap to "ㅏ". Add this test if not already present.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test -- --reporter=verbose src/lib/jamo/composition.test.ts src/lib/jamo/rotation.test.ts 2>&1 | tail -40</automated>
  </verify>
  <done>
    composition.ts imports reverse-lookup maps from jamo-data.ts (no local declarations). All composition tests pass including multi-syllable edge case and table-driven composeSyllable cases. All rotation tests pass with updated clockwise vowel order expectations.
  </done>
</task>

<task type="auto">
  <name>Task 4: README.md fixes and full test suite verification</name>
  <files>
    src/lib/jamo/README.md
  </files>
  <action>
    **[1] Remove trailing sentence from line 3:**
    Current first paragraph:
    "Low-level Unicode mechanics for Hangul Compatibility Jamo (U+3130–U+318F). Provides static data tables and the pure functions that operate on them. Has no concept of the game or a player — it is a toolkit consumed by `character/`."

    Remove the last sentence. Result:
    "Low-level Unicode mechanics for Hangul Compatibility Jamo (U+3130–U+318F). Provides static data tables and the pure functions that operate on them."

    **[8] Fix incorrect "decomposeJamo" reference; use consistent "compose" wording:**
    Scan the Contracts section for any reference to "decomposeJamo" — the README currently lists `decomposeSyllable` which is correct. The reviewer flagged inconsistent wording around compose/decompose. Review the Contracts section:
    - Current: `composeSyllable(...)` and `decomposeSyllable(...)` — these are consistent.
    - The reviewer likely flagged the use of mixed terminology. Ensure every contract entry uses the verb form consistently ("compose" / "decompose" not "decomposeJamo" or "decompose syllable").
    - If `getNextRotation` is referenced but the export is named `nextRotation` (it isn't — current export is `getNextRotation`), fix any such discrepancy.
    - Review line 11 of README which references `getNextRotation(jamo)` — this matches the actual export, which is correct.
    - Remove or correct any stale reference to "decomposeJamo" if present. If the README already uses correct function names, the fix is purely to ensure the wording is clean and uses "compose" consistently (not "build" or "construct").

    After edits, run the full test suite to confirm all 4 tasks together produce zero failures:
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test 2>&1 | tail -20</automated>
  </verify>
  <done>
    README.md trailing sentence removed. Compose/decompose wording consistent. Full test suite passes with zero failures and zero TypeScript errors (pnpm exec tsc --noEmit).
  </done>
</task>

</tasks>

<verification>
After all tasks complete:

1. TypeScript strict mode passes: `pnpm exec tsc --noEmit` — zero errors
2. Full test suite: `pnpm test` — all tests pass
3. Lint: `pnpm lint` — zero errors
4. Spot-check rotation: `ROTATION_SETS[1]` is `["ㅏ", "ㅜ", "ㅓ", "ㅗ"]` and `ROTATION_SETS[3]` is `["ㅑ", "ㅠ", "ㅕ", "ㅛ"]`
5. Spot-check type: `src/lib/jamo/types.ts` exports ConsonantJamo, VowelJamo, Jamo
6. Spot-check combinationOf: exported from jamo-data.ts, returns `CombinationRule | undefined`
7. Spot-check kind literals: grep for "doubleConsonant\|complexVowel" in src/ returns zero matches
8. COMBINATION_RULES has 27 entries (16 original + 11 compound batchim)
</verification>

<success_criteria>
- All 17 PR review comments addressed (mapped: [1][8] Task 4, [2][3][16] Task 1, [4][5] Task 1, [6] Tasks 1+3, [7] Task 1 via type unification, [9][10] Task 3, [11][12][13] Task 1, [14] Task 1, [15] Task 1, [17] Task 2)
- `pnpm test` exits 0
- `pnpm exec tsc --noEmit` exits 0
- `pnpm lint` exits 0
- No `JongseongUpgradeRule` type remains in codebase
- No lowercase kind literals (`doubleConsonant`, `complexVowel`) remain in codebase
- `src/lib/jamo/types.ts` is a new file with ConsonantJamo and VowelJamo
- `character/types.ts` uses ConsonantJamo / VowelJamo in Character slots
</success_criteria>

<output>
After completion, create `.planning/quick/260408-kty-resolve-pr-review-design-decisions-befor/260408-kty-SUMMARY.md` using the summary template.
</output>
