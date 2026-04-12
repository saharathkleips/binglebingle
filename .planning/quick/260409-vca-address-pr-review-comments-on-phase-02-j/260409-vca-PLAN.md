---
id: 260409-vca
type: quick
autonomous: true
files_modified:
  - src/lib/jamo/rotation.ts
  - src/lib/jamo/jamo.test.ts
  - src/lib/jamo/composition.ts
  - src/lib/jamo/composition.test.ts
  - src/lib/character/character.ts
  - src/lib/character/character.test.ts
  - src/lib/character/types.ts
  - src/lib/character/README.md
---

<objective>
Address 17 PR review comments on phase-02 jamo-core across rotation, composition, and character modules.

Purpose: Clean up exported implementation details, improve test structure, tighten types, and consolidate character module.
Output: Cleaner public APIs, merged test rows, folded types.ts into character.ts, corrected README.
</objective>

<execution_context>
@/workspaces/binglebingle/.claude/get-shit-done/workflows/execute-plan.md
@/workspaces/binglebingle/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: rotation.ts and jamo.test.ts — hide ROTATION_SETS and merge reverse-lookup tests</name>
  <files>src/lib/jamo/rotation.ts, src/lib/jamo/jamo.test.ts</files>
  <action>
    **rotation.ts (comment 1):**
    Remove the `export` keyword from the `ROTATION_SETS` constant declaration. The public API is `getNextRotation` only; ROTATION_SETS is an implementation detail. Any tests that currently import ROTATION_SETS directly must go through `getNextRotation` instead (verify no test files import ROTATION_SETS — if any do, remove those imports and the tests that use them, since the public function covers the behavior).

    **jamo.test.ts (comments 2, 3, 4):**
    For each of the three position groups (choseong, jungseong, jongseong), the test currently has two separate blocks: an `it.each` that maps jamo→index, and a separate `it("reverse map is correct")` loop. Merge these so each `it.each` row also asserts the reverse direction:

    - CHOSEONG (comment 2, line 49): Rename the `it.each` test label from `"maps %s to %i and uses Compatibility Jamo codepoint"` to `"maps %s↔%i and uses Compatibility Jamo codepoint"`. Inside the test body add `expect(CHOSEONG_BY_INDEX[idx]).toBe(jamo);`. Then delete the standalone `it("reverse map is correct for all entries")` block.

    - JUNGSEONG (comment 3, line 94): Same pattern — add `expect(JUNGSEONG_BY_INDEX[idx]).toBe(jamo);` inside the existing `it.each` body and delete the standalone reverse-map test.

    - JONGSEONG (comment 4, line 155): For the jongseong `it.each`, add `expect(JONGSEONG_BY_INDEX[idx]).toBe(jamo);` inside the test body and delete the standalone reverse-map test. Note the empty-string case `["", 0]` — `JONGSEONG_BY_INDEX[0]` should equal `""`, so no special guard is needed.

    After changes: three `it.each` blocks with bidirectional assertions, no separate reverse-map tests.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test --reporter=verbose src/lib/jamo/jamo.test.ts src/lib/jamo/rotation.test.ts 2>&1 | tail -30</automated>
  </verify>
  <done>ROTATION_SETS is not exported. All jamo index tests pass with bidirectional assertions merged into each row. No standalone reverse-map tests remain.</done>
</task>

<task type="auto">
  <name>Task 2: composition.ts and composition.test.ts — simplify builder, remove cast, fix test structure</name>
  <files>src/lib/jamo/composition.ts, src/lib/jamo/composition.test.ts</files>
  <action>
    **composition.ts — COMBINATION_MAP builder (comment 5):**
    Refactor the IIFE builder for COMBINATION_MAP using `.flatMap`. The current loop pushes entries conditionally; replace with a `.flatMap` over COMBINATION_RULES that returns an array of `[string, Jamo]` pairs per rule, then pass that to `new Map(...)`. Example shape:

    ```ts
    const COMBINATION_MAP: ReadonlyMap<string, Jamo> = new Map(
      COMBINATION_RULES.flatMap((rule) => {
        const [a, b] = rule.inputs;
        const fwd: [string, Jamo] = [`${a}|${b}`, rule.output];
        if ((rule.kind === "DOUBLE_CONSONANT" || rule.kind === "COMPLEX_VOWEL") && a !== b) {
          return [fwd, [`${b}|${a}`, rule.output]];
        }
        return [fwd];
      }),
    );
    ```

    Remove the IIFE wrapper — `new Map(iterable)` replaces it.

    **composition.ts — composeJamo (comment 6, line 125):**
    The function `composeJamo` is already a one-liner (`return COMBINATION_MAP.get(...) ?? null`). Verify nothing needs changing here. If there was a multi-line form, simplify with `.map`. No change needed if already correct.

    **composition.ts — decomposeJamo cast (comment 7, line 155):**
    Current: `return parts ? ([...parts] as [Jamo, Jamo]) : null;`
    The spread `[...parts]` creates `Jamo[]`, requiring the cast to `[Jamo, Jamo]`. The stored value is `readonly [Jamo, Jamo]`, so a direct return `return parts ?? null;` works since the map stores `readonly [Jamo, Jamo]` and the return type is `[Jamo, Jamo] | null`. Check: if `DECOMPOSE_MAP` is typed as `ReadonlyMap<Jamo, readonly [Jamo, Jamo]>`, the return type of `get` is `readonly [Jamo, Jamo] | undefined`. The function signature returns `[Jamo, Jamo] | null`. Either update the return type to `readonly [Jamo, Jamo] | null` or keep a minimal cast. Remove the spread if it's not needed. Prefer: update function return type to `readonly [Jamo, Jamo] | null` and return `parts ?? null` with no cast.

    **composition.test.ts — remove explicit cast (comment 8, line 9):**
    `const getTypedRules = (): CombinationRule[] => COMBINATION_RULES as CombinationRule[];`
    Since `COMBINATION_RULES` is already typed as `readonly CombinationRule[]`, the cast is redundant. Change to:
    `const getTypedRules = (): readonly CombinationRule[] => COMBINATION_RULES;`
    Or inline COMBINATION_RULES directly in the `it.each` calls and remove the helper entirely if it's only used there.

    **composition.test.ts — reuse COMPOSE_CASES for decomposeSyllable tests (comments 9 and 10):**
    The 3 individual `decomposeSyllable` test cases at lines 89-111 (decompose 한, 가, 훿) duplicate data already present in the `COMPOSE_CASES` table. Refactor to drive `decomposeSyllable` assertions from `COMPOSE_CASES`:

    - Keep the `COMPOSE_CASES` table as-is (it drives `composeSyllable` tests).
    - Add a new `it.each(COMPOSE_CASES)` block for `decomposeSyllable` that:
      1. Calls `composeSyllable(cho, jung, jong)` to get the syllable string.
      2. Calls `decomposeSyllable(syllable)` on the result.
      3. Asserts `choseong === cho`, `jungseong === jung`, `jongseong === jong ?? null`.
    - Delete the 3 hand-written `decomposeSyllable` cases that duplicate COMPOSE_CASES rows (한, 가, 훿). Keep the non-duplicate tests (null for bare jamo, null for non-Korean, multi-syllable truncation, codepoint range check, and existing round-trip test).

    This means the decompose section becomes table-driven from COMPOSE_CASES for the happy-path, with targeted edge-case tests only for the null/boundary behaviors.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test --reporter=verbose src/lib/jamo/composition.test.ts 2>&1 | tail -30</automated>
  </verify>
  <done>COMBINATION_MAP built via .flatMap without IIFE. decomposeJamo returns without spread cast. No explicit cast in getTypedRules. decomposeSyllable happy-path tests driven from COMPOSE_CASES. All tests pass.</done>
</task>

<task type="auto">
  <name>Task 3: character module — fold types.ts, fix logic bugs, remove re-export, fix README</name>
  <files>src/lib/character/character.ts, src/lib/character/character.test.ts, src/lib/character/types.ts, src/lib/character/README.md</files>
  <action>
    **Fold types.ts into character.ts (comment 11):**
    1. Copy the full contents of `types.ts` (the `Character` type definition and the re-exports of `ConsonantJamo`, `VowelJamo`, `Jamo`) into `character.ts` at the top, before the function definitions.
    2. Update the import in `character.ts` from `import type { Character, ConsonantJamo, VowelJamo } from "./types";` to use the locally defined types.
    3. Check `character.test.ts` — if it imports from `"./types"`, update those imports to `"./character"`.
    4. Delete `src/lib/character/types.ts`.
    5. Verify no other file in the repo imports from `src/lib/character/types` — if any do, update those imports to point to `./character` or the appropriate path.

    **Remove re-export of decomposeSyllable (comment 12, line 249):**
    Delete `export { decomposeSyllable };` at the bottom of `character.ts`. If any caller outside this file imports `decomposeSyllable` from `character.ts`, update those imports to `../jamo/composition` directly (it belongs to the jamo layer). Check with a grep for `from.*character.*decomposeSyllable` or `decomposeSyllable.*from.*character`.

    **Check JONGSEONG_SPLIT_MAP vs decomposeJamo (comment 13, line 26):**
    Compare `JONGSEONG_SPLIT_MAP` in `character.ts` with `decomposeJamo` in `composition.ts`.
    - `decomposeJamo` decomposes ALL combination results (double consonants, complex vowels, compound batchim).
    - `JONGSEONG_SPLIT_MAP` only contains COMPOUND_BATCHIM rules.
    - They are NOT duplicates — `JONGSEONG_SPLIT_MAP` is a filtered subset typed as `ConsonantJamo` pairs. `decomposeJamo` returns `Jamo` pairs and covers all kinds.
    - Since `decompose()` in character.ts needs `ConsonantJamo` pairs specifically for compound batchim, `JONGSEONG_SPLIT_MAP` is appropriate. Document this in a comment: `// Filtered subset of COMBINATION_RULES — COMPOUND_BATCHIM only, typed as ConsonantJamo pairs for decompose().` Do NOT remove it.

    **Fix resolveCharacter logic comment (comment 14, line 149):**
    The JSDoc comment says "No choseong AND no jungseong → null". The reviewer notes: a character with jongseong but no jungseong can still be displayed (it's a bare consonant conceptually), and the truly unrenderable case is jungseong + jongseong without choseong.
    - Update the JSDoc to accurately describe behavior: "Jungseong without choseong renders as bare vowel. Jongseong without choseong and jungseong is an invalid state that returns null (jongseong is only valid when choseong+jungseong are present). Strictly unrenderable: { jungseong, jongseong } with no choseong."
    - The actual code logic at line 160 checks `if (choseong === undefined && jungseong === undefined) return null;` — this correctly returns null for empty. But `{ jungseong, jongseong }` without choseong would fall through to the `jungseong !== undefined && choseong === undefined` branch and return just `jungseong`, silently ignoring jongseong. Decide: either treat `{ jungseong, jongseong }` as null (invalid state) or return jungseong (silently drop jongseong). Add an explicit guard: `if (jungseong !== undefined && choseong === undefined && jongseong !== undefined) return null;` before the existing bare-jungseong check, and update the JSDoc accordingly.

    **Investigate type cast at line 171 (comment 15):**
    Line 171: `choseong as ChoseongJamo`
    `choseong` is typed as `ConsonantJamo | undefined` (from `Character.choseong`). `composeSyllable` expects `ChoseongJamo`. If `ChoseongJamo` is a subset of `ConsonantJamo`, the cast is lossy — not all consonants are valid as choseong (e.g. compound batchim like ㄳ cannot be choseong). Check the type definitions: if `Character.choseong` is typed as `ConsonantJamo` (which includes compound batchim), the cast is necessary but potentially unsound. Update the `Character` type so `choseong` is typed as `ChoseongJamo` (not `ConsonantJamo`) since choseong slots never hold compound batchim. Then the cast becomes unnecessary. Update `Character` type in the folded types section:
    ```ts
    export type Character = {
      choseong?: ChoseongJamo;
      jungseong?: VowelJamo;
      jongseong?: JongseongJamo;  // also tighten: jongseong is JongseongJamo not ConsonantJamo
    };
    ```
    Cascade type changes through `combine()` and `decompose()` as needed to fix any new type errors. Run `pnpm typecheck` after to verify.

    **Remove redundant ?? null (comment 16, line 172):**
    Line 172: `composeSyllable(...) ?? null`
    `composeSyllable` already returns `string | null`, so `?? null` is redundant — it can only substitute when the left side is null or undefined, and null ?? null === null anyway. Remove the `?? null`:
    ```ts
    return composeSyllable(choseong, jungseong, jongseong as JongseongJamo | undefined);
    ```
    (The outer `?? null` in the full expression was added to handle the `undefined` return case, but `composeSyllable` returns `string | null` not `string | null | undefined`, so it's not needed.)

    **Fix README.md naming symmetry (comment 17, line 9):**
    The README lists both `combine` and `decompose` as function names. The reviewer notes these are not symmetric opposites — rename one to match the other, or rename `decompose` to match the opposite of `combine`. Since `combine(a, b)` adds jamo together, its opposite would be `split` or `uncombine`. Alternatively, since the jamo module uses `composeJamo`/`decomposeJamo`, use `decompose` (already present) and rename `combine` to `compose` for symmetry — but that would be a large API change. The simpler fix: in README.md only, clarify the naming. The reviewer may just mean the README description says "compose" (line 9 shows the file header mentions "combine/compose" mixing). Update README section to note: "`combine(a, b)` — adds one character to another (not the inverse of `decompose`; `decompose` steps back construction levels)." Or if the intent is to rename `decompose` → `split` in the README description to be symmetric with `combine`, do that in the README only without touching the function name.
    Best approach: rename `decompose` to `split` in README only, OR add a clarifying note. Re-read the actual README line 9: it says "rename to keep compose/decompose symmetric, or rename decompose to match the opposite of combine". The function `combine` adds jamo; its opposite would be `split` or `uncombine`. Rename `decompose` → `split` in README.md (and add note that the function in code is named `decompose` for historical reasons) — OR — rename the actual function. Given the function is already used in tests, rename it in README description to match: describe it as "split" behavior in the README while keeping the code name `decompose`. Add a clarifying sentence: "Note: `decompose` is the inverse of `combine` — not of `compose`/`composeSyllable`."
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm typecheck && pnpm test --reporter=verbose src/lib/character/ 2>&1 | tail -40</automated>
  </verify>
  <done>types.ts deleted and its contents folded into character.ts. decomposeSyllable re-export removed. Character type uses ChoseongJamo/JongseongJamo for tighter slot types. No redundant cast or ?? null on composeSyllable return. README clarifies combine/decompose naming. All character tests pass and typecheck clean.</done>
</task>

</tasks>

<verification>
After all tasks:

```bash
cd /workspaces/binglebingle && pnpm typecheck && pnpm test 2>&1 | tail -20
```

All tests pass, no type errors, no imports of deleted types.ts.
</verification>

<success_criteria>
- ROTATION_SETS not exported from rotation.ts
- jamo.test.ts: 3 standalone reverse-map tests removed, assertions merged into existing it.each rows
- COMBINATION_MAP builder uses .flatMap (no IIFE)
- decomposeJamo returns without spread cast
- getTypedRules cast removed in composition.test.ts
- decomposeSyllable happy-path tests in composition.test.ts driven from COMPOSE_CASES
- types.ts deleted, content folded into character.ts
- decomposeSyllable re-export removed from character.ts
- Character type uses ChoseongJamo for choseong slot (not ConsonantJamo)
- Redundant ?? null removed from composeSyllable return
- README.md naming clarified
- pnpm typecheck passes, pnpm test passes
</success_criteria>

<output>
After completion, create `.planning/quick/260409-vca-address-pr-review-comments-on-phase-02-j/260409-vca-SUMMARY.md`
</output>
