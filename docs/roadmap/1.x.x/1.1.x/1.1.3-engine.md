# Milestone: Engine

**Status:** Pending
**Requirements:** ENGN-01, ENGN-02, ENGN-03

## Goal

The three engine functions — canSubmit(), evaluateGuess(), and calculateScore() — enforce game rules and are independently unit-tested.

## Requirements

- [ ] **ENGN-01**: canSubmit() validates that a submitted guess is constructible from the jamo pool via rotation and/or combination
- [ ] **ENGN-02**: evaluateGuess() returns per-character CharacterResult (correct / present / absent) for a submitted guess against the target word
- [ ] **ENGN-03**: calculateScore() returns a score value based on guess count

## Success Criteria

1. canSubmit() returns true for a guess whose characters are constructible from the pool via rotation and/or combination, and false when a required jamo is not available
2. evaluateGuess() returns 'correct' for a character in the right position, 'present' for a character in the word but wrong position, and 'absent' otherwise
3. calculateScore() returns a numeric score value that decreases with more guesses
4. All exported functions in src/lib/engine/ have colocated Vitest tests that pass
