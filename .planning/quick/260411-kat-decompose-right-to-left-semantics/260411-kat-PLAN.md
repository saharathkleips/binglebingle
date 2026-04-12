---
phase: quick
plan: 260411-kat
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/jamo/composition.ts
  - src/lib/jamo/composition.test.ts
  - src/lib/character/character.ts
  - src/lib/character/character.test.ts
  - src/lib/character/README.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "decompose() always peels off the last-added jamo (right-to-left semantics)"
    - "decomposeJamo('ㅙ') returns ['ㅘ', 'ㅣ'] — the last-added ㅣ is peeled first"
    - "decomposeJamo('ㅞ') returns ['ㅝ', 'ㅣ'] — the last-added ㅣ is peeled first"
    - "decompose({choseong, jungseong:complex}) peels the jungseong's last part, keeping cho+jung-base intact"
    - "decompose({choseong, jungseong, jongseong:compound}) splits the compound batchim and returns [cho+jung+first, {choseong:second}]"
    - "All tests pass — no regressions"
  artifacts:
    - path: src/lib/jamo/composition.ts
      provides: "Swapped canonical/alternate designations for ㅙ and ㅞ combination rules"
    - path: src/lib/character/character.ts
      provides: "Updated decompose() — cho+jung path drills into complex vowels; compound jong path splits batchim"
  key_links:
    - from: composition.ts DECOMPOSE_MAP
      to: decomposeJamo('ㅙ')
      via: "COMBINATION_RULES filter(!alternate) — must exclude ㅗ+ㅐ rule"
      pattern: "alternate.*true"
    - from: character.ts decompose()
      to: decomposeJamo(jungseong)
      via: "cho+jung branch checks for complex vowel parts"
    - from: character.ts decompose()
      to: COMBINATION_RULES compound batchim inputs
      via: "compound jong branch splits into [cho+jung+first, {choseong:second}]"
---

<objective>
Update decompose() to follow right-to-left (last-added-first) decomposition semantics.

Korean syllable construction goes left-to-right: ㅎ → 호 → 화 → 홰 → 홱 → 홳. Decomposing must reverse that — always peeling off the last-added jamo, not the leftmost.

Purpose: The decompose mechanic is the game's undo button. Korean speakers expect the last keystroke to be the one undone, making the interaction feel natural.

Output: Updated composition.ts (canonical swap for ㅙ/ㅞ), updated character.ts decompose() (new cho+jung and compound-jong paths), updated tests and README.
</objective>

<execution_context>
@/workspaces/binglebingle/.claude/get-shit-done/workflows/execute-plan.md
@/workspaces/binglebingle/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/jamo/composition.ts
@src/lib/jamo/composition.test.ts
@src/lib/character/character.ts
@src/lib/character/character.test.ts
@src/lib/character/README.md
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Swap canonical/alternate for ㅙ and ㅞ in composition.ts + update composition.test.ts</name>
  <files>src/lib/jamo/composition.ts, src/lib/jamo/composition.test.ts</files>
  <behavior>
    - decomposeJamo("ㅙ") returns ["ㅘ", "ㅣ"] (was ["ㅗ", "ㅐ"])
    - decomposeJamo("ㅞ") returns ["ㅝ", "ㅣ"] (was ["ㅜ", "ㅔ"])
    - composeJamo("ㅗ", "ㅐ") still returns "ㅙ" (alternate path remains in COMBINATION_MAP)
    - composeJamo("ㅘ", "ㅣ") still returns "ㅙ" (canonical path remains in COMBINATION_MAP)
    - All round-trip decomposeJamo(composeJamo(inputs)) tests for canonical rules still pass
  </behavior>
  <action>
    In `src/lib/jamo/composition.ts`, swap the `alternate: true` flags on the two pairs:

    For ㅙ (lines 75-76):
    - `{ inputs: ["ㅗ", "ㅐ"], output: "ㅙ", kind: "COMPLEX_VOWEL", alternate: true }` (add alternate: true)
    - `{ inputs: ["ㅘ", "ㅣ"], output: "ㅙ", kind: "COMPLEX_VOWEL" }` (remove alternate: true)

    For ㅞ (lines 79-80):
    - `{ inputs: ["ㅜ", "ㅔ"], output: "ㅞ", kind: "COMPLEX_VOWEL", alternate: true }` (add alternate: true)
    - `{ inputs: ["ㅝ", "ㅣ"], output: "ㅞ", kind: "COMPLEX_VOWEL" }` (remove alternate: true)

    Update the inline comments to reflect new canonical vs alternate designations.

    In `src/lib/jamo/composition.test.ts`, update the "canonical paths for alternate-input vowels" describe block (lines 27-35):
    - Change test description and assertion for ㅙ: `expect(decomposeJamo("ㅙ")).toEqual(["ㅘ", "ㅣ"])`
    - Change test description and assertion for ㅞ: `expect(decomposeJamo("ㅞ")).toEqual(["ㅝ", "ㅣ"])`

    Also update the compose test labels in character.test.ts lines 53-77 (the it.each entries):
    - `"jung(ㅗ)+jung(ㅐ) → ㅙ (canonical)"` → `"jung(ㅗ)+jung(ㅐ) → ㅙ (alternate)"`
    - `"jung(ㅘ)+jung(ㅣ) → ㅙ (alternate path)"` → `"jung(ㅘ)+jung(ㅣ) → ㅙ (canonical)"`
    - `"jung(ㅜ)+jung(ㅔ) → ㅞ (canonical)"` → `"jung(ㅜ)+jung(ㅔ) → ㅞ (alternate)"`
    - `"jung(ㅝ)+jung(ㅣ) → ㅞ (alternate path)"` → `"jung(ㅝ)+jung(ㅣ) → ㅞ (canonical)"`

    Note: only labels change in character.test.ts here — the inputs/outputs/expectations are unchanged because compose() behavior is unchanged.
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|decomposeJamo|ㅙ|ㅞ)"</automated>
  </verify>
  <done>
    decomposeJamo("ㅙ") returns ["ㅘ", "ㅣ"], decomposeJamo("ㅞ") returns ["ㅝ", "ㅣ"], all composition tests pass.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Update decompose() in character.ts for right-to-left semantics + update character.test.ts</name>
  <files>src/lib/character/character.ts, src/lib/character/character.test.ts</files>
  <behavior>
    cho+jung with complex vowel jungseong:
    - decompose({choseong:"ㅎ", jungseong:"ㅘ"}) → [{choseong:"ㅎ", jungseong:"ㅗ"}, {jungseong:"ㅏ"}]
    - decompose({choseong:"ㅎ", jungseong:"ㅙ"}) → [{choseong:"ㅎ", jungseong:"ㅘ"}, {jungseong:"ㅣ"}]  (using new ㅙ canonical)
    - decompose({choseong:"ㄱ", jungseong:"ㅏ"}) → [{choseong:"ㄱ"}, {jungseong:"ㅏ"}]  (unchanged, ㅏ is simple)

    full syllable with compound jongseong:
    - decompose({choseong:"ㅎ", jungseong:"ㅏ", jongseong:"ㄳ"}) → [{choseong:"ㅎ", jungseong:"ㅏ", jongseong:"ㄱ"}, {choseong:"ㅅ"}]
    - decompose({choseong:"ㄱ", jungseong:"ㅏ", jongseong:"ㄺ"}) → [{choseong:"ㄱ", jungseong:"ㅏ", jongseong:"ㄹ"}, {choseong:"ㄱ"}]
    - decompose({choseong:"ㅂ", jungseong:"ㅓ", jongseong:"ㅄ"}) → [{choseong:"ㅂ", jungseong:"ㅓ", jongseong:"ㅂ"}, {choseong:"ㅅ"}]
  </behavior>
  <action>
    In `src/lib/character/character.ts`, update the `decompose()` function — two paths need changes:

    **Path 1: cho+jung (no jongseong) — line ~310**
    Current code:
    ```
    if (jongseong === undefined) {
      return [{ choseong: choseong! }, { jungseong: jungseong! }];
    }
    ```
    New code — check if jungseong is a complex vowel and if so, keep choseong attached to its base:
    ```
    if (jongseong === undefined) {
      const parts = decomposeJamo(jungseong!);
      if (parts !== null) {
        return [
          { choseong: choseong!, jungseong: parts[0] as VowelJamo },
          { jungseong: parts[1] as VowelJamo },
        ];
      }
      return [{ choseong: choseong! }, { jungseong: jungseong! }];
    }
    ```

    **Path 2: full syllable compound jongseong — line ~316**
    Current code:
    ```
    if (isCompound) {
      return [{ choseong: choseong!, jungseong: jungseong! }, { jongseong }];
    }
    ```
    New code — split the compound batchim, return first part in jongseong slot, second as standalone choseong:
    ```
    if (isCompound) {
      const rule = COMBINATION_RULES.find(
        (r) => r.kind === "COMPOUND_BATCHIM" && r.output === jongseong,
      )!;
      const [first, second] = rule.inputs;
      return [
        { choseong: choseong!, jungseong: jungseong!, jongseong: first as JongseongJamo },
        { choseong: second as ChoseongJamo },
      ];
    }
    ```

    Also update the JSDoc for `decompose()` to reflect the new behavior — particularly the bullet points for "Choseong + jungseong" and "Full syllable, compound jongseong".

    In `src/lib/character/character.test.ts`, update the following tests:

    **Standalone decompose() tests (in the it.each table):**
    - `"complex vowel ㅙ (3-jamo, canonical ㅗ+ㅐ) → [jung ㅗ, jung ㅐ]"` test: change expected to `[{jungseong:"ㅘ"},{jungseong:"ㅣ"}]` and update label to reflect new canonical
    - ADD new row: `"complex vowel ㅞ (canonical ㅝ+ㅣ) → [jung ㅝ, jung ㅣ]"` → `[{jungseong:"ㅝ"},{jungseong:"ㅣ"}]`
    - `"cho+jung(ㅘ) → [cho, jung ㅘ] (complex vowel preserved)"` test: change expected to `[{choseong:"ㄱ", jungseong:"ㅗ"},{jungseong:"ㅏ"}]` and update label
    - `"full, compound jong ㄳ → [cho+jung, jong ㄳ]"` test: change expected to `[{choseong:"ㅎ",jungseong:"ㅏ",jongseong:"ㄱ"},{choseong:"ㅅ"}]` and update label
    - `"full, compound jong ㄺ → [cho+jung, jong ㄺ]"` test: change expected to `[{choseong:"ㄱ",jungseong:"ㅏ",jongseong:"ㄹ"},{choseong:"ㄱ"}]` and update label
    - `"full, compound jong ㅄ → [cho+jung, jong ㅄ]"` test: change expected to `[{choseong:"ㅂ",jungseong:"ㅓ",jongseong:"ㅂ"},{choseong:"ㅅ"}]` and update label

    **Workflow tests:**
    - 화 workflow: update `decompose({choseong:"ㅎ", jungseong:"ㅘ"})` assertion to `[{choseong:"ㅎ", jungseong:"ㅗ"}, {jungseong:"ㅏ"}]`; update describe label to reflect that decompose(cho+jung(ㅘ)) now gives [cho+ㅗ, ㅏ] directly (no longer 2-step); remove the separate `decompose({jungseong:"ㅘ"})` sub-step from the decompose test (that step is no longer needed — one decompose call from 화 now returns ㅎ+ㅗ + ㅏ)
    - 홰 workflow: update `decompose({choseong:"ㅎ", jungseong:"ㅙ"})` assertion to `[{choseong:"ㅎ", jungseong:"ㅘ"}, {jungseong:"ㅣ"}]`; update `decompose({jungseong:"ㅙ"})` assertion to `[{jungseong:"ㅘ"},{jungseong:"ㅣ"}]` (third step still decomposes ㅘ to [ㅗ,ㅏ]); adjust describe label and steps accordingly
    - 홳 workflow: update `decompose({choseong:"ㅎ", jungseong:"ㅙ", jongseong:"ㄳ"})` assertion to `[{choseong:"ㅎ", jungseong:"ㅙ", jongseong:"ㄱ"}, {choseong:"ㅅ"}]`; update describe label
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>
    All character tests pass. decompose() follows right-to-left semantics: cho+jung with complex vowel drills into the vowel (keeping choseong bound to the base), compound jongseong splits and the second consonant becomes a standalone choseong. No test regressions.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update character/README.md decompose contract</name>
  <files>src/lib/character/README.md</files>
  <action>
    Update the `decompose(char)` contract bullet in README.md to reflect the new right-to-left semantics. Replace the current description with:

    "decompose(char) — steps a Character back by one construction level following right-to-left (last-added-first) semantics. Never loses a jamo. Returns at most two Character objects per call. Simple single-jamo characters return a one-element array; double consonant choseong and complex vowel jungseong split into their two component jamo. Choseong + complex jungseong peels off the last-added vowel part, keeping choseong bound to the base vowel (e.g. 화 → {ㅎ,ㅗ} + {ㅏ}). Choseong + simple jungseong peels off the jungseong entirely (e.g. 호 → {ㅎ} + {ㅗ}). Full syllables with a compound jongseong split the batchim in two: the first consonant stays as jongseong; the second becomes a standalone choseong (e.g. 홳 → {ㅎ,ㅙ,ㄱ} + {ㅅ}). Full syllables with a simple jongseong return the jongseong as a standalone choseong (unchanged). Returns [] only for the empty Character {}."
  </action>
  <verify>
    <automated>cd /workspaces/binglebingle && pnpm test 2>&1 | tail -5</automated>
  </verify>
  <done>
    README.md decompose contract accurately describes right-to-left semantics and all new decompose() behaviors. All tests still pass.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete:

```bash
cd /workspaces/binglebingle && pnpm test
```

All tests pass. TypeScript compiles clean:

```bash
cd /workspaces/binglebingle && pnpm tsc --noEmit
```
</verification>

<success_criteria>
- `decomposeJamo("ㅙ")` returns `["ㅘ", "ㅣ"]`
- `decomposeJamo("ㅞ")` returns `["ㅝ", "ㅣ"]`
- `decompose({choseong:"ㅎ", jungseong:"ㅘ"})` returns `[{choseong:"ㅎ", jungseong:"ㅗ"}, {jungseong:"ㅏ"}]`
- `decompose({choseong:"ㅎ", jungseong:"ㅙ", jongseong:"ㄳ"})` returns `[{choseong:"ㅎ", jungseong:"ㅙ", jongseong:"ㄱ"}, {choseong:"ㅅ"}]`
- `pnpm test` passes with zero failures
- `pnpm tsc --noEmit` passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/260411-kat-decompose-right-to-left-semantics/260411-kat-SUMMARY.md`
</output>
