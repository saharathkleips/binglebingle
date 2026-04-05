# Requirements: 빙글빙글 (Binglebingle)

**Defined:** 2026-04-05
**Core Value:** The jamo manipulation mechanic — rotate, combine, compose — must feel intuitive and satisfying.

## v1 Requirements

### Scaffold

- [ ] **SCAF-01**: Project scaffolded with Vite + React 19 + TypeScript (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes), Tailwind CSS, and pnpm
- [ ] **SCAF-02**: oxlint and oxfmt configured and enforced (config files present and passing)

### Jamo Core

- [ ] **JAMO-01**: Unicode data tables defined — CHOSEONG_INDEX, JUNGSEONG_INDEX, JONGSEONG_INDEX, ROTATION_SETS, COMBINATION_RULES — all using Hangul Compatibility Jamo (U+3130–U+318F)
- [ ] **JAMO-02**: Player can rotate a jamo to the next member of its equivalence set (getNextRotation, getRotationOptions)
- [ ] **JAMO-03**: Player can combine two jamo into a double consonant or complex vowel (combineJamo, decomposeJamo); compound batchim handled via upgradeJongseong
- [ ] **JAMO-04**: Jamo can be composed into a Korean syllable block and decomposed back (composeSyllable, decomposeSyllable) using Unicode formula: 0xAC00 + (cho×21+jung)×28 + jong

### Character

- [ ] **CHAR-01**: Character type `{ jamo: readonly string[] }` defined; resolveCharacter() reduces jamo list to combined jamo, syllable block, or null
- [ ] **CHAR-02**: isComplete() returns true when resolveCharacter produces a syllable block in range U+AC00–U+D7A3

### Word and Pool

- [ ] **WORD-01**: Word is a branded string type; createWord() validates the string is a non-empty sequence of Korean syllable blocks
- [ ] **WORD-02**: derivePool() decomposes a word into its constituent jamo; normalizePool() rotates each to the 0-index of its rotation set (obscuring the target word)
- [ ] **WORD-03**: loadWords() fetches public/data/words.json; selectWord() selects a word by strategy (daily date-seeded, random, or fixed)

### Engine

- [ ] **ENGN-01**: canSubmit() validates that a submitted guess is constructible from the jamo pool via rotation and/or combination
- [ ] **ENGN-02**: evaluateGuess() returns per-character CharacterResult (correct / present / absent) for a submitted guess against the target word
- [ ] **ENGN-03**: calculateScore() returns a score value based on guess count

### Game State

- [ ] **STAT-01**: GameState and GameAction types defined — full discriminated union with ROTATE_TOKEN, COMBINE_TOKENS, SPLIT_TOKEN, PLACE_TOKEN, REMOVE_FROM_SLOT, SUBMIT_GUESS, RESET_ROUND
- [ ] **STAT-02**: gameReducer() is a pure function (no async, no side effects); createInitialGameState(word) produces the initial state; correct submission slots stay filled after guess
- [ ] **STAT-03**: GameContext and useGame() hook expose game state and dispatch to the component tree

### UI — Components

- [ ] **UI-01**: Rack displays the jamo pool; player can tap a token to rotate it to the next jamo in its rotation set
- [ ] **UI-02**: Composer allows player to assemble jamo into a syllable character (assign to choseong/jungseong/jongseong slots), combine jamo within the working area, and decompose composed jamo back into constituents
- [ ] **UI-03**: Board displays guess history as a grid; each evaluated character tile is colored by result (correct / present / absent)
- [ ] **UI-04**: Player can drag jamo tokens from Rack to Composer (pointer and touch sensors via @dnd-kit)

### UI — Screens

- [ ] **UI-05**: Game shell renders NavBar and routes between game area and instructions screen
- [ ] **UI-06**: How to Play screen explains the rotate → combine → compose mechanic to new players
- [ ] **UI-07**: Results modal appears on win/loss; shows score and guess count summary
- [ ] **UI-08**: Dev settings panel (visible in dev mode only) allows overriding word selection strategy (daily / random / fixed word)

### Word List

- [ ] **DATA-01**: words.json contains a small placeholder word list (at least 5 words across 3-, 4-, and 5-character lengths) sufficient to make the game playable

## v2 Requirements

### CI/CD

- **CI-01**: GitHub Actions ci.yml runs oxlint, oxfmt check, tsc --noEmit, vitest, playwright, and vite build on push/PR
- **CI-02**: GitHub Actions deploy.yml deploys to GitHub Pages on push to main via actions/deploy-pages

### PWA

- **PWA-01**: Game is installable as a PWA with offline support (vite-plugin-pwa, service worker, manifest.webmanifest)

### Persistence

- **PERS-01**: Score history persisted to localStorage (ScoreRecord[] keyed by 'jamo-game-score-history')

### Word List

- **DATA-02**: Hand-curated word list of 50+ words across difficulty levels
- **DATA-03**: NIKL corpus integration for validated vocabulary

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiplayer / shared sessions | No backend |
| User accounts / leaderboards | No backend |
| Hard guess limit | Designer decision — may add post-MVP |
| Animated jamo rotation effects | UX iteration deferred |
| Accessibility / screen reader support | Post-MVP pass |
| Archaic / historical jamo | Out of modern Hangul scope |
| Complex jamo as given pool items | Always constructed from basic jamo |
| Mobile-native app | Web-first |
| Real-time word validation | Static only |
| Internationalization | Post-MVP |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | — | Pending |
| SCAF-02 | — | Pending |
| JAMO-01 | — | Pending |
| JAMO-02 | — | Pending |
| JAMO-03 | — | Pending |
| JAMO-04 | — | Pending |
| CHAR-01 | — | Pending |
| CHAR-02 | — | Pending |
| WORD-01 | — | Pending |
| WORD-02 | — | Pending |
| WORD-03 | — | Pending |
| ENGN-01 | — | Pending |
| ENGN-02 | — | Pending |
| ENGN-03 | — | Pending |
| STAT-01 | — | Pending |
| STAT-02 | — | Pending |
| STAT-03 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| UI-06 | — | Pending |
| UI-07 | — | Pending |
| UI-08 | — | Pending |
| DATA-01 | — | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 ⚠️

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after initial definition*
