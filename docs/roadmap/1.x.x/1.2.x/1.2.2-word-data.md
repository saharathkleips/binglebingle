# Milestone: Word Data

**Status:** Pending
**Requirements:** DATA-01

## Goal

words.json contains a working placeholder word list sufficient for end-to-end game play.

## Requirements

- [ ] **DATA-01**: words.json contains a small placeholder word list (at least 5 words across 3-, 4-, and 5-character lengths) sufficient to make the game playable

## Success Criteria

1. words.json contains at least 5 words
2. At least one word is 3 characters, one is 4 characters, and one is 5 characters
3. Every word in the file passes createWord() validation (all Korean syllable blocks)
4. loadWords() can parse the file and selectWord() returns a valid Word from it
