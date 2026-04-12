---
phase: quick-260410-qqb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/jamo/composition.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "COMBINATION_MAP key type is a typed template literal (CombinationKey = `${Jamo}|${Jamo}`), not a bare string"
    - "composeJamo and the COMBINATION_MAP builder use CombinationKey exclusively — no raw string interpolation leaks through"
    - "TypeScript compiler accepts the file under strict mode (pnpm build passes)"
    - "All existing composition tests continue to pass"
  artifacts:
    - path: "src/lib/jamo/composition.ts"
      provides: "Typed CombinationKey, updated COMBINATION_MAP, updated composeJamo"
      contains: "type CombinationKey"
  key_links:
    - from: "COMBINATION_MAP builder"
      to: "CombinationKey"
      via: "combKey() helper"
      pattern: "combKey\\("
---

<objective>
Replace the bare `string` key on `COMBINATION_MAP` with a typed template literal `CombinationKey = \`${Jamo}|${Jamo}\`` so that key construction and lookup are statically checked.

Purpose: The current `ReadonlyMap<string, Jamo>` accepts any string as a key; a typo in the separator or a non-Jamo character would silently produce wrong results. A template literal type narrows both construction sites (the builder and `composeJamo`) to valid Jamo pairs at compile time.

Output: Updated `src/lib/jamo/composition.ts` with `CombinationKey` type, a small `combKey()` helper, and all lookup/build sites updated. Tests unchanged and still passing.
</objective>

<execution_context>
@/workspaces/binglebingle/.claude/get-shit-done/workflows/execute-plan.md
@/workspaces/binglebingle/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/workspaces/binglebingle/.planning/STATE.md
@/workspaces/binglebingle/src/lib/jamo/composition.ts
@/workspaces/binglebingle/src/lib/jamo/composition.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Introduce CombinationKey type and update COMBINATION_MAP</name>
  <files>src/lib/jamo/composition.ts</files>
  <action>
In `src/lib/jamo/composition.ts`, make the following focused changes — no other lines should change:

1. Add a type alias immediately after the `Jamo` import block:
   ```typescript
   /** Typed map key for COMBINATION_MAP. Both slots must be valid Jamo. */
   type CombinationKey = `${Jamo}|${Jamo}`;
   ```

2. Add a small private helper right below the type (keeps construction DRY and typed):
   ```typescript
   const combKey = (a: Jamo, b: Jamo): CombinationKey => `${a}|${b}`;
   ```

3. Update `COMBINATION_MAP`'s type annotation from `ReadonlyMap<string, Jamo>` to `ReadonlyMap<CombinationKey, Jamo>`.

4. Inside the `COMBINATION_MAP` builder, replace the two raw template literals:
   - `\`${a}|${b}\`` → `combKey(a, b)` (the `fwd` entry)
   - `\`${b}|${a}\`` → `combKey(b, a)` (the reverse entry for commutative rules)
   Update the tuple type annotations on those entries from `[string, Jamo]` to `[CombinationKey, Jamo]`.

5. Inside `composeJamo`, replace the raw lookup:
   ```typescript
   COMBINATION_MAP.get(`${a}|${b}`)
   ```
   with:
   ```typescript
   COMBINATION_MAP.get(combKey(a, b))
   ```

No changes to `DECOMPOSE_MAP`, `CombinationRule`, `COMBINATION_RULES`, `composeSyllable`, `decomposeSyllable`, or any test files.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm exec tsc --noEmit && pnpm exec vitest run src/lib/jamo/composition.test.ts</automated>
  </verify>
  <done>
    - `CombinationKey` type exists and is used as the `COMBINATION_MAP` key type
    - `combKey()` helper used at all two construction sites and the one lookup site
    - `pnpm exec tsc --noEmit` exits 0 (strict mode, no errors)
    - All composition tests pass (27 rule round-trips + edge cases)
  </done>
</task>

</tasks>

<verification>
Run the full test suite to confirm no regressions across the lib:

```
cd /workspaces/binglebingle && pnpm exec vitest run src/lib/
```

All tests must pass. TypeScript must compile clean.
</verification>

<success_criteria>
- `COMBINATION_MAP` is typed `ReadonlyMap<CombinationKey, Jamo>` where `CombinationKey = \`${Jamo}|${Jamo}\``
- No raw string interpolation remains in key construction or lookup for this map
- `pnpm exec tsc --noEmit` passes
- `pnpm exec vitest run src/lib/` passes
</success_criteria>

<output>
After completion, create `.planning/quick/260410-qqb-fix-combination-map-key-type-from-string/260410-qqb-SUMMARY.md` following the summary template.
</output>
