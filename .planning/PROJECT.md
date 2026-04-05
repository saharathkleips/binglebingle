# 빙글빙글 (Binglebingle)

## What This Is

A single-player Korean word-guessing game for anyone who knows Hangul — primarily native speakers, but playable by learners with solid jamo knowledge. The player is given a pool of basic Korean jamo (자모) and must construct Korean syllable characters (글자) by rotating jamo into related forms, combining them into double consonants or complex vowels, and composing them into complete syllable blocks. Each submitted guess is evaluated character-by-character as correct (right position), present (wrong position), or absent.

Fully client-side PWA deployed to GitHub Pages. No backend, no auth, no accounts.

## Core Value

The jamo manipulation mechanic — rotate, combine, compose — must feel intuitive and satisfying. If that loop breaks or confuses, the game fails.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Player can manipulate jamo from their pool (rotate, combine, split)
- [ ] Player can compose jamo into complete Korean syllable characters
- [ ] Player can submit a guess and receive correct/present/absent feedback per character
- [ ] A daily word is selected via date-seeded algorithm from a hand-curated word list
- [ ] Pool is derived from the target word with jamo normalized (rotated to 0-index state)
- [ ] Correct characters remain in submission slots after a guess; present/absent tokens return to pool
- [ ] Game is installable as a PWA and works offline
- [ ] UI is deployed and accessible on GitHub Pages

### Out of Scope

- Multiplayer / shared sessions — no backend
- User accounts / leaderboards — no backend
- Hard guess limit — designer decision for MVP; may add post-MVP
- Accessibility / screen reader support — post-MVP pass
- NIKL corpus integration — hand-curated word list for MVP
- Mobile-native app — web-first
- Animated jamo rotation effects — UX iteration deferred

## Context

The game is named 빙글빙글 (binglebingle), meaning "spinning around" — a reference to the jamo rotation mechanic at the heart of the puzzle.

Technical design is fully specified across `docs/` plan documents:
- `docs/architecture.md` — system overview, layer boundaries, key decisions
- `docs/plan-models.md` — all TypeScript types and state shape
- `docs/plan-jamo.md` — Unicode tables, rotation, combination, syllable composition
- `docs/plan-word.md` — Word type, derivePool, normalizePool
- `docs/plan-engine.md` — canSubmit, evaluateGuess, calculateScore
- `docs/plan-game.md` — gameReducer, GameContext, setupGame, loadWords
- `docs/plan-ui.md` — component tree, interaction model, data flow
- `docs/conventions.md` — naming, imports, patterns, anti-patterns

Korean Unicode constraint: all jamo use Hangul Compatibility Jamo (U+3130–U+318F). Syllable blocks range U+AC00–U+D7A3.

## Constraints

- **Tech stack**: TypeScript (strict) + React 19 + Tailwind CSS + Vite + dnd-kit — fixed by architecture docs
- **Package manager**: pnpm — never npm or yarn
- **Hosting**: GitHub Pages (static, no backend possible)
- **Unicode**: Hangul Compatibility Jamo only in application code; Hangul Jamo block used only internally in compose/decompose
- **Purity**: `src/lib/` has no React imports; domain logic is fully unit-testable in isolation
- **Reducer**: pure — no async, no side effects; `SUBMIT_GUESS` receives pre-computed `GuessRecord`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rotation as equivalence sets | Simple lookup, designer-controlled, UX-agnostic | — Pending |
| Pool resets each guess (correct slots stay) | Reduces cognitive load; keeps correct progress visible | — Pending |
| Word length 3/4/5 → easy/medium/hard (UI only) | Difficulty is a display concern; no field on Puzzle type | — Pending |
| Compound batchim valid in jongseong only | Linguistically correct; prevents invalid syllable construction | — Pending |
| Date-seeded daily puzzle | Consistent Wordle-like daily experience | — Pending |
| No hard guess limit (MVP) | Designer decision; extensible post-MVP | — Pending |
| Hand-curated word list for MVP | Avoids corpus complexity at launch | — Pending |
| ㅙ/ㅞ combination is associative (two valid paths) | Both bracketing orders produce the same result; Composer stages intermediates | — Pending |
| Pure domain logic in `src/lib/` | Fully unit-testable; clean layer separation | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*
