# Milestone: Word and Pool

**Status:** Pending
**Requirements:** WORD-01, WORD-02, WORD-03

## Goal

The Word branded type, pool derivation pipeline, and word loading/selection implemented and tested.

## Requirements

- [ ] **WORD-01**: Word is a branded string type; createWord() validates the string is a non-empty sequence of Korean syllable blocks
- [ ] **WORD-02**: derivePool() decomposes a word into its constituent jamo; normalizePool() rotates each to the 0-index of its rotation set (obscuring the target word)
- [ ] **WORD-03**: loadWords() fetches public/data/words.json; selectWord() selects a word by strategy (daily date-seeded, random, or fixed)

## Success Criteria

1. createWord() rejects strings that are not Korean syllable blocks and accepts valid words like '한국어'
2. derivePool('한국어') returns the correct flat jamo array; normalizePool() rotates each jamo to the 0-index of its rotation set (e.g. ㄴ→ㄱ, ㅓ→ㅏ)
3. loadWords() fetches and parses words.json without error (tested with a fixture)
4. selectWord() with strategy 'daily' returns the same word for the same date; with strategy 'random' it returns a valid Word
5. All exported functions in src/lib/word/ have colocated Vitest tests that pass
