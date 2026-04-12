---
name: PR Review Decisions — jamo phase
description: Design decisions captured before implementing 17 PR review comments on gsd/phase-02-jamo-core
type: project
---

# Quick Task 260408-kty: Resolve PR review design decisions — Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Task Boundary

Implement all 17 PR review comments on gsd/phase-02-jamo-core. The items span:
- README.md fixes (2 items)
- jamo-data.ts data/type changes (6 items)
- composition.ts restructuring (2 items)
- API ergonomics — new `combinationOf` helper (1 item)
- Test improvements (5 items)
- Type relocation/restructuring (1 item)

</domain>

<decisions>
## Implementation Decisions

### Rotation API [16][2][3]
- Replace unordered `ROTATION_SETS` with **ordered** arrays that define clockwise rotation order
- Fix rotation orders per review suggestions:
  - `["ㅏ", "ㅜ", "ㅓ", "ㅗ"]` (was `["ㅏ", "ㅓ", "ㅗ", "ㅜ"]`)
  - `["ㅑ", "ㅠ", "ㅕ", "ㅛ"]` (was `["ㅑ", "ㅕ", "ㅛ", "ㅠ"]`)
- Add `nextRotation(jamo: string): string | undefined` — returns the next clockwise jamo (wraps around), `undefined` if not rotatable
- `ROTATION_MAP` can be derived from ordered sets or replaced by `nextRotation` entirely (Claude's discretion on cleanest shape)

### Rule type unification [4][7][5]
- **Merge `JongseongUpgradeRule` into `CombinationRule`** — add `"compoundBatchim"` (or SCREAMING: `COMPOUND_BATCHIM`) as a third `kind`
- User insight: `COMBINATION_RULES` itself isn't commutative — `COMBINATION_MAP` encodes commutativity implicitly via sorted key. The type separation was misleading, not protecting anything.
- The existing `JONGSEONG_UPGRADE_MAP` lookup logic (non-sorted key, because compound batchim ARE order-dependent) stays semantically separate, but the **type** is unified
- Rename `JONGSEONG_UPGRADE_RULES` → merge into `COMBINATION_RULES` (or keep as a named subset for readability — Claude's discretion)
- Apply SCREAMING_SNAKE_CASE to `kind` literals: `DOUBLE_CONSONANT`, `COMPLEX_VOWEL`, `COMPOUND_BATCHIM` [5]

### Jamo type relocation and split [17]
- Move `Jamo` type from `character/types.ts` → `src/lib/jamo/types.ts` (new file or existing if one exists)
- Split into `ConsonantJamo` and `VowelJamo` sub-unions, with `Jamo = ConsonantJamo | VowelJamo`
- Update `Character` type slots: `choseong?: ConsonantJamo`, `jungseong?: VowelJamo`, `jongseong?: ConsonantJamo`
- Update all import sites

### Index numbering documentation [15]
- Add/improve JSDoc on `CHOSEONG_INDEX`, `JUNGSEONG_INDEX`, `JONGSEONG_INDEX` clarifying these are **UAX #15 ordinals for syllable block composition arithmetic**, not Unicode codepoint values
- Claude's discretion on exact wording — keep it concise

### Claude's Discretion
- [6] Where exactly maps are colocated in composition.ts
- [8] Exact wording for README.md compose/decompose fix
- [1] README.md trailing sentence removal
- [9][10][11][12][13] Table-driven test implementation style
- [14] `combinationOf(A, B)` function placement (jamo-data.ts or a new query file)

</decisions>

<specifics>
## Specific Ideas

- Review comment [14] explicitly requests `combinationOf(A, B): CombinationRule | undefined` as the API wrapper around `COMBINATION_MAP` — implement this
- Review comment [9]: multi-syllable input to `compose()` should return `null` (test this edge case)
- Review comment [10]: `compose()` tests should be table-driven across a handful of characters
- Review comments [11][12]: jamo index tests are currently too sparse (skip 1–17 indices); convert to table-driven, combine with compatibility jamo test, assert e.g. `ㄱ → index 0`
- Review comment [13]: test all combination rules, not just a subset

</specifics>

<canonical_refs>
## Canonical References

- PR review comments: gsd/phase-02-jamo-core branch (17 comments captured above)
- UAX #15 (Unicode Normalization Forms) — basis for ordinal index values
- Hangul Compatibility Jamo block: U+3130–U+318F (all jamo literals must use this block)

</canonical_refs>
