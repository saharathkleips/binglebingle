# Quick Plan: Fix Broken Build

## Task

Fix TypeScript compilation errors preventing build. Run `pnpm build` and `pnpm tsc --noEmit` to catch all errors before verification.

## Tasks

### 1. Fix rotation.ts return type

**File**: `src/lib/jamo/rotation.ts:55`

**Issue**: `ROTATION_MAP.get(jamo)` returns `Jamo[] | undefined`, but function signature says it returns `Jamo | null`.

**Fix**: Change return type to `Jamo[] | null` and adjust logic.

### 2. Fix composition.ts type issues

**File**: `src/lib/jamo/composition.ts:121, 154, 208`

**Issues**:
- Line 121: `const [a, b] = rule.inputs;` - `rule.inputs` is `readonly [Jamo, Jamo]`, can't assign to mutable array
- Line 154: Same tuple assignment issue
- Line 208: Returns `undefined` when `jongIdx === 0`, but type expects `JongseongJamo | null`

**Fixes**:
- Use spread operator or `Array.from()` for readonly tuples
- Change `null` return to `undefined` or explicitly return `null` for missing jongseong

### 3. Fix composition.test.ts invalid test cases

**File**: `src/lib/jamo/composition.test.ts:62, 66`

**Issues**:
- Line 62: `composeSyllable("ㅃ")` - "ㅃ" is a consonant, not a valid jongseong parameter
- Line 66: `composeSyllable("ㄱ")` - "ㄱ" is a consonant, not a valid jungseong parameter

**Fix**: Remove or correct these test cases. They test invalid usage.

### 4. Fix jamo.test.ts invalid index access

**File**: `src/lib/jamo/jamo.test.ts:144-146`

**Issues**: Accessing `JONGSEONG_INDEX["ㄸ"]`, `JONGSEONG_INDEX["ㅃ"]`, `JONGSEONG_INDEX["ㅉ"]` - these keys don't exist because double consonants can't be jongseong.

**Fix**: Remove these test cases or change to valid jongseong values.

### 5. Fix character.ts type casts

**File**: `src/lib/character/character.ts:77, 91, 108, 125, 162, 220, 221`

**Issues**: Type mismatches when assigning/returning jamo values. The code is trying to assign `Jamo` to `ConsonantJamo` or `VowelJamo` types.

**Fix**: Add proper type assertions where appropriate, or adjust type definitions.

### 6. Fix character.test.ts invalid test

**File**: `src/lib/character/character.test.ts:160`

**Issue**: Test passes invalid types to `combine()`.

**Fix**: Correct the test to use valid types.

## Constraints

- All fixes must pass `pnpm tsc --noEmit`
- All fixes must pass `pnpm test --run`
- No behavior changes, only type safety fixes