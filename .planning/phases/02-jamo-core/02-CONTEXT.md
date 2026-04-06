# Phase 2: Jamo Core - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning
**Source:** PRD Express Path (docs/plan-jamo.md + docs/plan-models.md)

<domain>
## Phase Boundary

Implements the jamo linguistic foundation — all data tables and core operations as pure functions with full unit test coverage. No React, no game state, no UI. Everything in `src/lib/jamo/` and `src/lib/character/`.

**Delivers:**
- `src/lib/jamo/jamo-data.ts` — Unicode index tables (CHOSEONG, JUNGSEONG, JONGSEONG), rotation sets/map, combination rules/map, jongseong upgrade rules/map
- `src/lib/jamo/rotation.ts` — `getRotationOptions()`, `getNextRotation()`
- `src/lib/jamo/composition.ts` — `combineJamo()`, `upgradeJongseong()`, `composeSyllable()`, `decomposeSyllable()`
- `src/lib/character/types.ts` — `Character` type
- `src/lib/character/character.ts` — `resolveCharacter()`, `isComplete()`
- Colocated Vitest tests for all of the above

</domain>

<decisions>
## Implementation Decisions

### File Layout (locked)
```
src/lib/jamo/
├── jamo-data.ts
├── jamo-data.test.ts
├── rotation.ts
├── rotation.test.ts
├── composition.ts
└── composition.test.ts

src/lib/character/
├── types.ts
├── character.ts
└── character.test.ts
```

### Unicode Codepoints (locked)
- All jamo in application code MUST use Hangul Compatibility Jamo codepoints (U+3130–U+318F)
- `'ㄱ'.codePointAt(0) === 0x3131` — not 0x1100
- Hangul Jamo block (U+1100–U+11FF) used only internally in composeSyllable/decomposeSyllable arithmetic

### CHOSEONG_INDEX — 19 entries (locked)
```
ㄱ:0  ㄲ:1  ㄴ:2  ㄷ:3  ㄸ:4  ㄹ:5  ㅁ:6  ㅂ:7  ㅃ:8  ㅅ:9
ㅆ:10 ㅇ:11 ㅈ:12 ㅉ:13 ㅊ:14 ㅋ:15 ㅌ:16 ㅍ:17 ㅎ:18
```

### JUNGSEONG_INDEX — 21 entries (locked)
```
ㅏ:0  ㅐ:1  ㅑ:2  ㅒ:3  ㅓ:4  ㅔ:5  ㅕ:6  ㅖ:7  ㅗ:8  ㅘ:9
ㅙ:10 ㅚ:11 ㅛ:12 ㅜ:13 ㅝ:14 ㅞ:15 ㅟ:16 ㅠ:17 ㅡ:18 ㅢ:19 ㅣ:20
```

### JONGSEONG_INDEX — 28 entries (locked, index 0 = no final consonant)
```
'':0  ㄱ:1  ㄲ:2  ㄳ:3  ㄴ:4  ㄵ:5  ㄶ:6  ㄹ:7  ㄺ:8  ㄻ:9
ㄼ:10 ㄽ:11 ㄾ:12 ㄿ:13 ㅀ:14 ㅁ:15 ㅂ:16 ㅄ:17 ㅅ:18 ㅆ:19
ㅇ:20 ㅈ:21 ㅊ:22 ㅋ:23 ㅌ:24 ㅍ:25 ㅎ:26
```
Note: ㄸ, ㅃ, ㅉ NOT in jongseong table (not valid final consonants).

### ROTATION_SETS (locked)
```typescript
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ["ㄱ", "ㄴ"],
  ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],
  ["ㅣ", "ㅡ"],
  ["ㅑ", "ㅕ", "ㅛ", "ㅠ"],
];
```
ROTATION_MAP derived from ROTATION_SETS at module load.

### COMBINATION_RULES (locked)
Double consonants: ㄱ+ㄱ→ㄲ, ㄷ+ㄷ→ㄸ, ㅂ+ㅂ→ㅃ, ㅅ+ㅅ→ㅆ, ㅈ+ㅈ→ㅉ
Complex vowels (16 rules): ㅏ+ㅣ→ㅐ, ㅑ+ㅣ→ㅒ, ㅓ+ㅣ→ㅔ, ㅕ+ㅣ→ㅖ, ㅗ+ㅏ→ㅘ, ㅗ+ㅐ→ㅙ, ㅗ+ㅣ→ㅚ, ㅜ+ㅓ→ㅝ, ㅜ+ㅔ→ㅞ, ㅜ+ㅣ→ㅟ, ㅡ+ㅣ→ㅢ
COMBINATION_MAP: key = sorted inputs joined with '|'. combineJamo is commutative.

### JONGSEONG_UPGRADE_RULES (locked, NOT commutative)
ㄱ+ㅅ→ㄳ, ㄴ+ㅈ→ㄵ, ㄴ+ㅎ→ㄶ, ㄹ+ㄱ→ㄺ, ㄹ+ㅁ→ㄻ, ㄹ+ㅂ→ㄼ, ㄹ+ㅅ→ㄽ, ㄹ+ㅌ→ㄾ, ㄹ+ㅍ→ㄿ, ㄹ+ㅎ→ㅀ, ㅂ+ㅅ→ㅄ
JONGSEONG_UPGRADE_MAP: key = 'existing|additional' (NOT sorted — order matters).

### Function Signatures (locked)
```typescript
// rotation.ts
export function getRotationOptions(jamo: string): readonly string[]
export function getNextRotation(jamo: string): string | null

// composition.ts
export function combineJamo(a: string, b: string): string | null
export function upgradeJongseong(existingJongseong: string, additional: string): string | null
export function composeSyllable(choseong: string, jungseong: string, jongseong?: string): string | null
export function decomposeSyllable(syllable: string): { choseong: string; jungseong: string; jongseong: string | null } | null

// character/character.ts
export function resolveCharacter(character: Character): string | null
export function isComplete(character: Character): boolean
```

### Character Type (locked)
```typescript
export type Character = { jamo: readonly string[] }
```
jamo list is always length 0, 1, 2, or 3 — never longer (combinations always collapse pairwise).

### Syllable Composition Formula (locked)
```
SYLLABLE_BASE = 0xAC00
codepoint = SYLLABLE_BASE + (choIdx * 21 + jungIdx) * 28 + jongIdx
```

### resolveCharacter Logic (locked)
- length 0 → null
- length 1 → return jamo[0] as-is
- length 2 → try combineJamo first; if null try composeSyllable; if null return null
- length 3 → composeSyllable(jamo[0], jamo[1], jamo[2]) or null

### isComplete (locked)
Returns true iff resolveCharacter produces a codepoint in U+AC00–U+D7A3.

### Claude's Discretion
- Whether to build COMBINATION_MAP and JONGSEONG_UPGRADE_MAP inline in jamo-data.ts (IIFE) or in separate initialization
- invertRecord / reverse-lookup implementation detail in decomposeSyllable
- Test file organization (describe blocks, test naming conventions)
- Whether to export CHOSEONG_BY_INDEX etc. or keep them module-private

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Jamo Implementation Design
- `docs/plan-jamo.md` — Complete implementation plan: exact data tables, function signatures, step-by-step instructions, test cases, resolved assumptions

### Data Types and Interfaces
- `docs/plan-models.md` — Single source of truth for all TypeScript types: Character, PoolToken, GameState, all action types

### Project Conventions
- `docs/conventions.md` — Coding conventions for the project
- `docs/architecture.md` — Architecture decisions

### Existing Source
- `src/` — Current scaffolded code (Phase 1 output)

</canonical_refs>

<specifics>
## Specific Ideas

From docs/plan-jamo.md:

- 훿 (ㅎ + ㅞ + ㄳ) is a test target requiring complex vowel + compound batchim
- combineJamo uses sorted key: `[a, b].sort().join('|')` for commutativity
- upgradeJongseong uses ordered key: `${existing}|${additional}` (not sorted)
- decomposeSyllable reverse-lookup: build CHOSEONG_BY_INDEX etc. via Object.entries at module load
- Gotcha: copy-pasted jamo must use U+3130–U+318F not U+1100–U+11FF or lookups silently fail

</specifics>

<deferred>
## Deferred Ideas

- `src/lib/word/` (derivePool, normalizePool, createWord) — Phase 3 or later
- `src/state/` (reducer, game state) — later phase
- UI and React components — later phase

</deferred>

---

*Phase: 02-jamo-core*
*Context gathered: 2026-04-06 via PRD Express Path (docs/plan-jamo.md + docs/plan-models.md)*
