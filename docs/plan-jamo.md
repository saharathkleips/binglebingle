# plan-jamo.md
> Jamo Domain — Implementation Plan
> Depends on: plan-models.md
> Status: draft — awaiting review

---

## What This Domain Does

Everything that is a fact about the Korean writing system. Rotation rules, combination rules, syllable composition and decomposition, the Unicode index tables. This domain is the linguistic foundation every other domain calls into.

**Boundaries:**
- In: raw jamo strings, syllable block strings
- Out: transformed jamo strings, composed/decomposed syllables, lookup results
- No knowledge of: game rules, pool state, UI, React

All exports are pure functions or readonly constants. No side effects. No mutable state.

---

## File Map

```
src/lib/jamo/
├── jamo-data.ts       # all static data: index tables, rotation sets, combination rules
├── rotation.ts        # getRotationOptions(), getNextRotation()
├── composition.ts     # combineJamo(), composeSyllable(), decomposeSyllable()
├── jamo-data.test.ts  # invariant checks on the data tables
├── rotation.test.ts
└── composition.test.ts

src/lib/character/
├── types.ts           # Character type
├── character.ts       # resolveCharacter(), isComplete()
└── character.test.ts
```

---

## Implementation Steps

### Step 1 — `jamo-data.ts`: Unicode Index Tables

Hardcode the three position index tables. These are fixed by the Unicode standard (UAX #15) and must not be computed — look them up and write them in directly.

**Choseong (초성) — 19 entries:**
```
ㄱ:0  ㄲ:1  ㄴ:2  ㄷ:3  ㄸ:4  ㄹ:5  ㅁ:6  ㅂ:7  ㅃ:8  ㅅ:9
ㅆ:10 ㅇ:11 ㅈ:12 ㅉ:13 ㅊ:14 ㅋ:15 ㅌ:16 ㅍ:17 ㅎ:18
```

**Jungseong (중성) — 21 entries:**
```
ㅏ:0  ㅐ:1  ㅑ:2  ㅒ:3  ㅓ:4  ㅔ:5  ㅕ:6  ㅖ:7  ㅗ:8  ㅘ:9
ㅙ:10 ㅚ:11 ㅛ:12 ㅜ:13 ㅝ:14 ㅞ:15 ㅟ:16 ㅠ:17 ㅡ:18 ㅢ:19 ㅣ:20
```

**Jongseong (종성) — 28 entries (index 0 = no final consonant):**
```
'':0  ㄱ:1  ㄲ:2  ㄳ:3  ㄴ:4  ㄵ:5  ㄶ:6  ㄹ:7  ㄺ:8  ㄻ:9
ㄼ:10 ㄽ:11 ㄾ:12 ㄿ:13 ㅀ:14 ㅁ:15 ㅂ:16 ㅄ:17 ㅅ:18 ㅆ:19
ㅇ:20 ㅈ:21 ㅊ:22 ㅋ:23 ㅌ:24 ㅍ:25 ㅎ:26
```

Note: double consonants ㄸ, ㅃ, ㅉ do **not** appear in the jongseong table — they are not valid final consonants in standard Korean.

Export shape:
```typescript
export const CHOSEONG_INDEX:  Readonly<Record<string, number>>
export const JUNGSEONG_INDEX: Readonly<Record<string, number>>
export const JONGSEONG_INDEX: Readonly<Record<string, number>>
// JONGSEONG_INDEX[''] === 0
```

**Gotcha**: The jamo characters in these tables must use **Hangul Compatibility Jamo codepoints (U+3130–U+318F)**, not the Hangul Jamo block (U+1100–U+11FF). Verify with: `'ㄱ'.codePointAt(0) === 0x3131` (not 0x1100). If you copy-paste jamo from a source that uses the Jamo block, lookups will silently fail.

---

### Step 2 — `jamo-data.ts`: Rotation Sets and Map

```typescript
export const ROTATION_SETS: readonly (readonly string[])[] = [
  ['ㄱ', 'ㄴ'],
  ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ'],
  ['ㅣ', 'ㅡ'],
  ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'],
]

// Built once at module load from ROTATION_SETS.
// Maps each jamo to every other member of its set (excluding itself).
export const ROTATION_MAP: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>()
  for (const set of ROTATION_SETS) {
    for (const jamo of set) {
      map.set(jamo, set.filter(j => j !== jamo))
    }
  }
  return map
})()
```

---

### Step 3 — `jamo-data.ts`: Combination Rules and Jongseong Upgrade Rules

Combination rules cover only **doubleConsonants** and **complexVowels**. Compound batchim are not produced by combination — they are handled separately via jongseong upgrade (see Step 5a).

```typescript
export const COMBINATION_RULES: readonly CombinationRule[] = [
  // Double consonants
  { inputs: ['ㄱ', 'ㄱ'], output: 'ㄲ', kind: 'doubleConsonant' },
  { inputs: ['ㄷ', 'ㄷ'], output: 'ㄸ', kind: 'doubleConsonant' },
  { inputs: ['ㅂ', 'ㅂ'], output: 'ㅃ', kind: 'doubleConsonant' },
  { inputs: ['ㅅ', 'ㅅ'], output: 'ㅆ', kind: 'doubleConsonant' },
  { inputs: ['ㅈ', 'ㅈ'], output: 'ㅉ', kind: 'doubleConsonant' },

  // Complex vowels
  { inputs: ['ㅏ', 'ㅣ'], output: 'ㅐ', kind: 'complexVowel' },
  { inputs: ['ㅑ', 'ㅣ'], output: 'ㅒ', kind: 'complexVowel' },
  { inputs: ['ㅓ', 'ㅣ'], output: 'ㅔ', kind: 'complexVowel' },
  { inputs: ['ㅕ', 'ㅣ'], output: 'ㅖ', kind: 'complexVowel' },
  { inputs: ['ㅗ', 'ㅏ'], output: 'ㅘ', kind: 'complexVowel' },
  { inputs: ['ㅗ', 'ㅐ'], output: 'ㅙ', kind: 'complexVowel' },
  { inputs: ['ㅗ', 'ㅣ'], output: 'ㅚ', kind: 'complexVowel' },
  { inputs: ['ㅜ', 'ㅓ'], output: 'ㅝ', kind: 'complexVowel' },
  { inputs: ['ㅜ', 'ㅔ'], output: 'ㅞ', kind: 'complexVowel' },
  { inputs: ['ㅜ', 'ㅣ'], output: 'ㅟ', kind: 'complexVowel' },
  { inputs: ['ㅡ', 'ㅣ'], output: 'ㅢ', kind: 'complexVowel' },
]

// Derived lookup — key is sorted input pair joined with '|'
export const COMBINATION_MAP: ReadonlyMap<string, CombinationRule>
```

Jongseong upgrade rules are stored separately. Each rule defines which single jongseong + additional consonant produces a compound batchim jongseong:

```typescript
type JongseongUpgradeRule = {
  existing: string    // the single consonant already in jongseong position
  additional: string  // the consonant being added
  output: string      // the resulting compound batchim
}

export const JONGSEONG_UPGRADE_RULES: readonly JongseongUpgradeRule[] = [
  { existing: 'ㄱ', additional: 'ㅅ', output: 'ㄳ' },
  { existing: 'ㄴ', additional: 'ㅈ', output: 'ㄵ' },
  { existing: 'ㄴ', additional: 'ㅎ', output: 'ㄶ' },
  { existing: 'ㄹ', additional: 'ㄱ', output: 'ㄺ' },
  { existing: 'ㄹ', additional: 'ㅁ', output: 'ㄻ' },
  { existing: 'ㄹ', additional: 'ㅂ', output: 'ㄼ' },
  { existing: 'ㄹ', additional: 'ㅅ', output: 'ㄽ' },
  { existing: 'ㄹ', additional: 'ㅌ', output: 'ㄾ' },
  { existing: 'ㄹ', additional: 'ㅍ', output: 'ㄿ' },
  { existing: 'ㄹ', additional: 'ㅎ', output: 'ㅀ' },
  { existing: 'ㅂ', additional: 'ㅅ', output: 'ㅄ' },
]

// Derived lookup — key is 'existing|additional'
export const JONGSEONG_UPGRADE_MAP: ReadonlyMap<string, string>
```

Note: jongseong upgrade is **not** commutative — `existing` and `additional` are ordered. `ㄱ+ㅅ→ㄳ` is valid; `ㅅ+ㄱ` is not.

---

### Step 4 — `rotation.ts`

```typescript
export function getRotationOptions(jamo: string): readonly string[] {
  return ROTATION_MAP.get(jamo) ?? []
}

export function getNextRotation(jamo: string): string | null {
  const options = ROTATION_MAP.get(jamo)
  if (!options || options.length === 0) return null
  // Find position of jamo in its full set, return next member (wrapping)
  const set = ROTATION_SETS.find(s => s.includes(jamo))!
  const idx = set.indexOf(jamo)
  return set[(idx + 1) % set.length]
}
```

**Edge cases:**
- Jamo not in any set: `getRotationOptions` returns `[]`, `getNextRotation` returns `null`
- Single-member sets: not currently defined, but if one were added, `getNextRotation` would return the same jamo (wraps to itself). Handle this in tests.

---

### Step 5 — `composition.ts`: `combineJamo`

```typescript
function makeCombinationKey(a: string, b: string): string {
  // Sort inputs so commutativity is handled by key construction
  return [a, b].sort().join('|')
}

export function combineJamo(a: string, b: string): string | null {
  const rule = COMBINATION_MAP.get(makeCombinationKey(a, b))
  return rule?.output ?? null
}
```

**Gotcha**: The `inputs` arrays in `COMBINATION_RULES` must be stored in the same sorted order that `makeCombinationKey` produces, otherwise lookups will fail for half the combinations. Either sort `inputs` when building the map, or enforce sorted order in the data definition.

**What `combineJamo` does NOT handle**: compound batchim. `combineJamo('ㄱ', 'ㅅ')` returns `null`. Use `upgradeJongseong` instead.

---

### Step 5a — `composition.ts`: `upgradeJongseong`

This function is the only path to creating compound batchim. It is called when the player adds a consonant to a character that already has a choseong, jungseong, and single-consonant jongseong.

```typescript
// Returns the compound batchim produced by combining existingJongseong with additional,
// or null if no upgrade rule exists for this pair.
// Not commutative — order of arguments matters.
export function upgradeJongseong(
  existingJongseong: string,
  additional: string,
): string | null {
  const key = `${existingJongseong}|${additional}`
  return JONGSEONG_UPGRADE_MAP.get(key) ?? null
}
```

**When to call this vs `combineJamo`**: the caller (the `COMBINE_TOKENS` reducer case) is responsible for deciding which function applies based on context:
- If combining two standalone pool tokens → call `combineJamo`
- If adding a consonant to a Character that already has choseong + jungseong + single jongseong → call `upgradeJongseong`

The distinction lives in the reducer, not in these functions.

---

### Step 6 — `composition.ts`: `composeSyllable` and `decomposeSyllable`

```typescript
const SYLLABLE_BASE = 0xAC00

export function composeSyllable(
  choseong: string,
  jungseong: string,
  jongseong?: string,
): string | null {
  const cho = CHOSEONG_INDEX[choseong]
  const jung = JUNGSEONG_INDEX[jungseong]
  const jong = JONGSEONG_INDEX[jongseong ?? '']

  if (cho === undefined || jung === undefined || jong === undefined) return null

  const codepoint = SYLLABLE_BASE + (cho * 21 + jung) * 28 + jong
  return String.fromCodePoint(codepoint)
}

export function decomposeSyllable(
  syllable: string,
): { choseong: string; jungseong: string; jongseong: string | null } | null {
  const cp = syllable.codePointAt(0)
  if (cp === undefined || cp < 0xAC00 || cp > 0xD7A3) return null

  const offset = cp - SYLLABLE_BASE
  const jongIdx = offset % 28
  const jungIdx = Math.floor(offset / 28) % 21
  const choIdx  = Math.floor(offset / 28 / 21)

  // Reverse-lookup: find the jamo string for each index
  const choseong  = invertIndex(CHOSEONG_INDEX, choIdx)
  const jungseong = invertIndex(JUNGSEONG_INDEX, jungIdx)
  const jongseong = jongIdx === 0 ? null : invertIndex(JONGSEONG_INDEX, jongIdx)

  if (!choseong || !jungseong) return null  // should not happen with valid input
  return { choseong, jungseong, jongseong }
}

// Build reverse lookup maps once at module load
const CHOSEONG_BY_INDEX  = invertRecord(CHOSEONG_INDEX)
const JUNGSEONG_BY_INDEX = invertRecord(JUNGSEONG_INDEX)
const JONGSEONG_BY_INDEX = invertRecord(JONGSEONG_INDEX)

function invertRecord(rec: Readonly<Record<string, number>>): Record<number, string> {
  return Object.fromEntries(Object.entries(rec).map(([k, v]) => [v, k]))
}

function invertIndex(rec: Readonly<Record<string, number>>, idx: number): string | undefined {
  return Object.entries(rec).find(([, v]) => v === idx)?.[0]
  // Note: replace with reverse map lookup for performance if needed
}
```

**Gotcha**: `decomposeSyllable` returns compatibility jamo (U+3130–U+318F). Verify in tests by checking `decomposeSyllable('가')?.choseong === 'ㄱ'` and `'ㄱ'.codePointAt(0) === 0x3131`.

---

### Step 7 — `character/types.ts` and `character/character.ts`

```typescript
// types.ts
export type Character = {
  jamo: readonly string[]
}
```

Since combination is always pairwise and `combineJamo` always returns a single jamo string, combinations collapse immediately into a new single-jamo token — they are never accumulated in a list. The multi-jamo state in a Character only occurs during syllable composition, where the player places a choseong, jungseong, and optional jongseong together. These are always already-resolved single jamo (which may themselves be the output of prior combination steps). Therefore **a Character's jamo list is always length 1, 2, or 3** — never longer.

For example, 훿 (ㅎ + ㅞ + ㄳ) has 6 atomic jamo but the player builds it as:
- `ㅓ + ㅣ → ㅔ` (combine, collapse to single token)
- `ㅜ + ㅔ → ㅞ` (combine, collapse)
- `ㄱ + ㅅ → ㄳ` (combine, collapse)
- Compose `ㅎ + ㅞ + ㄳ → 훿` (jamo list is `['ㅎ','ㅞ','ㄳ']`)

```typescript
export function resolveCharacter(character: Character): string | null {
  const { jamo } = character

  if (jamo.length === 0) return null

  // Single jamo — returns itself (may be a combined jamo like ㅐ or ㄳ)
  if (jamo.length === 1) return jamo[0]

  // Two jamo — attempt combination first, then syllable composition
  if (jamo.length === 2) {
    const combined = combineJamo(jamo[0], jamo[1])
    if (combined !== null) return combined
    return composeSyllable(jamo[0], jamo[1]) ?? null
  }

  // Three jamo — syllable composition: choseong + jungseong + jongseong
  if (jamo.length === 3) {
    return composeSyllable(jamo[0], jamo[1], jamo[2]) ?? null
  }

  // Should not be reachable — combining always collapses to a single jamo
  return null
}
```

**Edge cases to handle:**
- `jamo` is empty: return `null`
- `['ㅐ']` — a single already-combined jamo: returns `'ㅐ'`; `isComplete` returns false (not in syllable range)
- `['ㄱ', 'ㅎ']` — two jamo with no combination rule and not a valid syllable: returns `null`
- `['ㄳ']` — a single compound batchim (valid jongseong): returns `'ㄳ'`; `isComplete` returns false (bare jamo)

---

## Test Coverage Required

Every exported function must have tests covering the cases below. Tests live colocated with their source file.

### `jamo-data.test.ts`
- All 19 choseong entries present and point to correct indices
- All 21 jungseong entries present
- All 28 jongseong entries present; `''` maps to `0`
- No double consonants (ㄸ, ㅃ, ㅉ) in jongseong table
- All jamo in index tables use compatibility codepoints (0x3130–0x318F range)
- All ROTATION_SETS entries are disjoint (no jamo in two sets)
- ROTATION_MAP contains an entry for every jamo in every ROTATION_SET
- All COMBINATION_RULES have non-null output; no duplicate input pairs

### `rotation.test.ts`
- `getRotationOptions('ㄱ')` returns `['ㄴ']`
- `getRotationOptions('ㅏ')` returns `['ㅓ','ㅗ','ㅜ']` (order per set)
- `getRotationOptions('ㅎ')` returns `[]`
- `getNextRotation('ㄱ')` returns `'ㄴ'`
- `getNextRotation('ㄴ')` returns `'ㄱ'` (wraps)
- `getNextRotation('ㅏ')` returns `'ㅓ'`; `'ㅜ'` wraps to `'ㅏ'`
- `getNextRotation('ㅎ')` returns `null`

### `composition.test.ts`
- `combineJamo('ㅏ','ㅣ')` === `'ㅐ'`
- `combineJamo('ㅣ','ㅏ')` === `'ㅐ'` (commutative)
- `combineJamo('ㄱ','ㄱ')` === `'ㄲ'`
- `combineJamo('ㄱ','ㅎ')` === `null` (no rule)
- `combineJamo('ㄱ','ㅅ')` === `null` (compound batchim — not handled by combineJamo)
- `upgradeJongseong('ㄱ','ㅅ')` === `'ㄳ'`
- `upgradeJongseong('ㄹ','ㄱ')` === `'ㄺ'`
- `upgradeJongseong('ㅅ','ㄱ')` === `null` (not commutative)
- `upgradeJongseong('ㄱ','ㄱ')` === `null` (no such compound batchim)
- `composeSyllable('ㄱ','ㅏ')` === `'가'`
- `composeSyllable('ㅎ','ㅏ','ㄴ')` === `'한'`
- `composeSyllable('ㅎ','ㅞ','ㄳ')` === `'훿'`
- `composeSyllable('ㅇ','ㅏ')` === `'아'` (silent ieung as choseong)
- `composeSyllable('ㄸ','ㅏ')` is valid (ㄸ is valid choseong)
- `composeSyllable('ㅎ','ㅏ','ㅃ')` === `null` (ㅃ not valid jongseong)
- `decomposeSyllable('한')` === `{ choseong:'ㅎ', jungseong:'ㅏ', jongseong:'ㄴ' }`
- `decomposeSyllable('가')` === `{ choseong:'ㄱ', jungseong:'ㅏ', jongseong: null }`
- `decomposeSyllable('훿')` === `{ choseong:'ㅎ', jungseong:'ㅞ', jongseong:'ㄳ' }`
- `decomposeSyllable('ㄱ')` === `null` (not a syllable block)
- All decomposed jamo use compatibility codepoints

### `character.test.ts`
- `resolveCharacter({ jamo: ['ㄱ'] })` === `'ㄱ'`
- `resolveCharacter({ jamo: ['ㅐ'] })` === `'ㅐ'` (already-combined vowel resolves to itself)
- `resolveCharacter({ jamo: ['ㅏ', 'ㅣ'] })` === `'ㅐ'` (combination)
- `resolveCharacter({ jamo: ['ㄱ', 'ㄱ'] })` === `'ㄲ'` (double consonant)
- `resolveCharacter({ jamo: ['ㄱ', 'ㅏ'] })` === `'가'` (syllable, no jongseong)
- `resolveCharacter({ jamo: ['ㅎ', 'ㅐ'] })` === `'해'` (syllable with combined vowel)
- `resolveCharacter({ jamo: ['ㅎ', 'ㅏ', 'ㄴ'] })` === `'한'` (syllable with jongseong)
- `resolveCharacter({ jamo: ['ㅎ', 'ㅞ', 'ㄳ'] })` === `'훿'` (complex vowel + compound batchim, already collapsed)
- `resolveCharacter({ jamo: ['ㄱ', 'ㅎ'] })` === `null` (no combination rule, not a valid syllable)
- `resolveCharacter({ jamo: [] })` === `null`
- `isComplete({ jamo: ['ㄱ', 'ㅏ'] })` === `true`
- `isComplete({ jamo: ['ㅏ', 'ㅣ'] })` === `false` (resolves to ㅐ, not a syllable block)
- `isComplete({ jamo: ['ㄱ'] })` === `false`
- `isComplete({ jamo: ['ㅎ', 'ㅏ', 'ㄴ'] })` === `true`
- Round-trip: `decomposeSyllable(composeSyllable('ㅎ','ㅏ','ㄴ')!)` returns correct parts

---

## Resolved Assumptions

| # | Decision |
|---|---|
| J1 | Combining is always pairwise and collapses immediately to a single jamo. A Character's jamo list is always length 1, 2, or 3. `resolveCharacter` handles no cases beyond 3. |
| J2 | 훿 (6 atomic jamo) is reachable but the Character list at composition time is still `['ㅎ','ㅞ','ㄳ']` — max 3 — because each pairwise combination collapses before the next step. |
