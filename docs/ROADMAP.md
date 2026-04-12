# Roadmap: 빙글빙글 (Binglebingle)

## Overview

A greenfield Korean word-guessing game built layer by layer: scaffold first, then the
pure domain logic chain (jamo → character → word → engine), then state, then UI. Each
phase delivers a complete, independently verifiable capability. The game is playable end-
to-end after Phase 8 (Core UI); Phase 9 adds screens and dev tooling to complete the
v1 product.

## Phases

- [x] **Phase 1: Scaffold** — Vite + React + TypeScript + Tailwind + pnpm project with oxlint/oxfmt enforced (completed 2026-04-06)
- [x] **Phase 2: Jamo Core** — Unicode tables, rotation sets, combination rules, and syllable composition/decomposition (completed 2026-04-11)
- [ ] **Phase 3: Character** — Character type, resolveCharacter(), and isComplete() with full unit coverage
- [ ] **Phase 4: Word and Pool** — Branded Word type, derivePool(), normalizePool(), loadWords(), and selectWord()
- [ ] **Phase 5: Engine** — canSubmit(), evaluateGuess(), and calculateScore() — the game's rule layer
- [ ] **Phase 6: Game State** — GameState types, pure gameReducer(), and GameContext/useGame() hook
- [ ] **Phase 7: Word Data** — Placeholder words.json with 5+ words across 3-, 4-, and 5-character lengths
- [ ] **Phase 8: Core UI** — Rack, Composer, Board, and drag-and-drop interaction wired to game state
- [ ] **Phase 9: Screens and Shell** — NavBar, How to Play, Results modal, Dev settings panel, and game shell

## Phase Details

### Phase 3: Character

**Goal**: The Character type and its two core functions — resolveCharacter() and isComplete() — are implemented and fully tested

**Requirements**: CHAR-01, CHAR-02

**Success Criteria:**

1. resolveCharacter({jamo:['ㅏ','ㅣ']}) returns 'ㅐ'; resolveCharacter({jamo:['ㅎ','ㅐ']}) returns '해'
2. resolveCharacter({jamo:['ㄱ','ㅏ','ㄱ']}) returns '각'; resolveCharacter({jamo:['ㄱ','ㅎ']}) returns null
3. isComplete({jamo:['ㅎ','ㅏ','ㄴ']}) returns true; isComplete({jamo:['ㄱ']}) returns false
4. All exported functions in src/lib/character/ have colocated Vitest tests that pass

### Phase 4: Word and Pool

**Goal**: The Word branded type, pool derivation pipeline, and word loading/selection are implemented and tested

**Requirements**: WORD-01, WORD-02, WORD-03

**Success Criteria:**

1. createWord() rejects strings that are not Korean syllable blocks and accepts valid words like '한국어'
2. derivePool('한국어') returns the correct flat jamo array; normalizePool() rotates each jamo to the 0-index of its rotation set (e.g. ㄴ→ㄱ, ㅓ→ㅏ)
3. loadWords() fetches and parses words.json without error (tested with a fixture)
4. selectWord() with strategy 'daily' returns the same word for the same date; with strategy 'random' it returns a valid Word
5. All exported functions in src/lib/word/ have colocated Vitest tests that pass

### Phase 5: Engine

**Goal**: The three engine functions — canSubmit(), evaluateGuess(), and calculateScore() — enforce game rules and are independently unit-tested

**Requirements**: ENGN-01, ENGN-02, ENGN-03

**Success Criteria:**

1. canSubmit() returns true for a guess whose characters are constructible from the pool via rotation and/or combination, and false when a required jamo is not available
2. evaluateGuess() returns 'correct' for a character in the right position, 'present' for a character in the word but wrong position, and 'absent' otherwise
3. calculateScore() returns a numeric score value that decreases with more guesses
4. All exported functions in src/lib/engine/ have colocated Vitest tests that pass

### Phase 6: Game State

**Goal**: GameState and the full GameAction discriminated union are typed; gameReducer() is a pure function that handles all actions correctly; GameContext and useGame() expose state and dispatch to React components

**Requirements**: STAT-01, STAT-02, STAT-03

**Success Criteria:**

1. Every action type in the GameAction union (ROTATE_TOKEN, COMBINE_TOKENS, SPLIT_TOKEN, PLACE_TOKEN, REMOVE_FROM_SLOT, SUBMIT_GUESS, RESET_ROUND) is handled by the reducer without TypeScript errors
2. gameReducer() returns state unchanged for invalid actions (e.g. rotating a non-rotatable jamo, combining two jamo with no rule)
3. After SUBMIT_GUESS with all-correct evaluation, correct submission slots remain filled and present/absent tokens return to pool
4. useGame() hook returns both state and dispatch; wrapping a component in GameProvider gives it access to game state

### Phase 7: Word Data

**Goal**: words.json contains a working placeholder word list sufficient for end-to-end game play

**Requirements**: DATA-01

**Success Criteria:**

1. words.json contains at least 5 words
2. At least one word is 3 characters, one is 4 characters, and one is 5 characters
3. Every word in the file passes createWord() validation (all Korean syllable blocks)
4. loadWords() can parse the file and selectWord() returns a valid Word from it

### Phase 8: Core UI

**Goal**: The Rack, Composer, and Board components are rendered in the browser; a player can rotate jamo tokens, drag tokens from Rack to Composer, compose a syllable character, place it into a submission slot, and submit a guess that is evaluated and displayed on the Board

**Requirements**: UI-01, UI-02, UI-03, UI-04

**Success Criteria:**

1. Player can tap a token in the Rack to cycle it to the next jamo in its rotation set
2. Player can drag a jamo token from the Rack to the Composer using a pointer or touch sensor
3. Player can assemble jamo into a syllable in the Composer and see the resolved character update in real time
4. Player can place a completed character into a submission slot and submit the guess
5. Submitted guess rows appear on the Board with each tile colored by its evaluation result (correct / present / absent)

### Phase 9: Screens and Shell

**Goal**: The complete game shell is assembled — NavBar, How to Play screen, Results modal, and dev settings panel — making the product navigable and self-explanatory for a new player

**Requirements**: UI-05, UI-06, UI-07, UI-08

**Success Criteria:**

1. NavBar renders on every screen and routes between the game area and the How to Play screen
2. How to Play screen explains the rotate, combine, and compose mechanic with enough clarity that a new player understands how to play
3. Results modal appears on win, showing the player's score and guess count
4. Dev settings panel is visible in development mode and allows switching word selection strategy (daily / random / fixed word); it is absent in production builds

## Progress

| Phase                | Status      | Completed  |
| -------------------- | ----------- | ---------- |
| 1. Scaffold          | Complete    | 2026-04-06 |
| 2. Jamo Core         | Complete    | 2026-04-11 |
| 3. Character         | Not started | —          |
| 4. Word and Pool     | Not started | —          |
| 5. Engine            | Not started | —          |
| 6. Game State        | Not started | —          |
| 7. Word Data         | Not started | —          |
| 8. Core UI           | Not started | —          |
| 9. Screens and Shell | Not started | —          |

Note: Phase 7 depends only on Phase 4, so it can run in parallel with Phases 5–6 in practice.
