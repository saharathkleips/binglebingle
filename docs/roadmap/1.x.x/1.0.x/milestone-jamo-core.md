# Milestone: Jamo Core

**Status:** Complete (2026-04-11)
**Requirements:** JAMO-01, JAMO-02, JAMO-03, JAMO-04

## Goal

All jamo data tables defined and the three core operations — rotation, combination, and syllable composition/decomposition — implemented as pure functions with full unit test coverage.

## Requirements

- [x] **JAMO-01**: Unicode data tables defined — CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX, ROTATION_SETS, COMBINATION_RULES — all using Hangul Compatibility Jamo (U+3130–U+318F)
- [x] **JAMO-02**: Player can rotate a jamo to the next member of its equivalence set (getNextRotation, getRotationOptions)
- [x] **JAMO-03**: Player can combine two jamo into a double consonant or complex vowel (combineJamo, decomposeJamo); compound batchim handled via upgradeJongseong
- [x] **JAMO-04**: Jamo can be composed into a Korean syllable block and decomposed back (composeSyllable, decomposeSyllable) using Unicode formula: 0xAC00 + (cho×21+jung)×28 + jong

## Success Criteria

1. CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX, ROTATION_SETS, and COMBINATION_RULES exported from jamo-data.ts using only U+3130–U+318F codepoints
2. getNextRotation() cycles ㄱ→ㄴ→ㄱ; getRotationOptions() returns [] for non-rotatable jamo
3. combineJamo('ㄱ','ㄱ') returns 'ㄲ'; combineJamo('ㅗ','ㅏ') returns 'ㅘ'; combineJamo('ㄱ','ㅎ') returns null
4. composeSyllable('ㅎ','ㅏ','ㄴ') returns '한'; decomposeSyllable('한') returns {choseong:'ㅎ', jungseong:'ㅏ', jongseong:'ㄴ'}
5. All exported functions in src/lib/jamo/ have colocated Vitest tests that pass
