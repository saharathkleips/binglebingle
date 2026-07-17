# SPEC: components/history-area

**Status:** stable

## Purpose

Renders the guess history read-only. Each past guess is a row of `HistoryTile` components colored by evaluation result.

**Boundaries:**

- Reads from: `useGame()` (state.history)
- Dispatches to: nothing
- Calls into: `src/components/tile` for shared tile visuals and character display

## File Map

```
history-area/
├── HistoryArea.tsx             # History container — maps rows to HistoryTile grids
├── HistoryArea.module.css      # Grid layout for history rows
├── HistoryTile.tsx             # Single evaluated tile — shared display + result styling
├── HistoryArea.test.tsx
├── HistoryTile.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### HistoryArea

Reads `state.history` from `useGame()`. Returns `null` when history is empty. Renders one `<div>` row per `GuessRecord`, each containing a `HistoryTile` per `EvaluatedCharacter`. The container reserves at least `--history-min-visible-rows` rows, then grows with submitted rows until the pool/submission content needs the remaining space; older history scrolls inside the history area after that point.

### HistoryTile

Receives a single `EvaluatedCharacter`. Renders `CharacterTile` when a character is present, or `BaseTile` with empty content when no character is present. Passes the engine `CharacterResult` directly to the shared tile so `CORRECT`, `PRESENT`, and `ABSENT` keep their visual variants without duplicating tile surface CSS.

`data-result` attribute mirrors the result value for test selection and potential CSS attribute targeting. Shared tile visuals live in `tile/BaseTile.module.css`; history rows use `--tile-submission-history-gap` so their portrait-only visual spacing matches submission while remaining independent from pool spacing. History tiles remain inert and do not attach pool or submission interaction behavior.

## Key Decisions

**HistoryArea returns null, not an empty container.** An empty `<div>` would occupy layout space before any guesses are made. Returning `null` keeps the layout clean on the first turn.

**History has a minimum, not a fixed maximum.** `--history-min-visible-rows` preserves the minimum history affordance, but the area can grow with actual submitted rows when vertical space is available. The history flex item uses its content as the basis and may shrink, so the full pool/submission content keeps priority in normal height tiers while older guesses scroll inside history when space runs out. At `600px` height and below, history is capped at its minimum so the pool gets the remaining short-height space before it scrolls.

**Rows anchor to the top.** Short history stacks start at the top of the game area. New guesses therefore increase the history area's content height and push submission/pool downward until the layout reaches its available vertical space; after that, the history area scrolls to keep the newest row visible.

**History scrolling snaps by row.** The scroll container uses vertical scroll snap and each row snaps on its block-end edge. This keeps manual review feeling row-by-row instead of free-scrolling between partial guesses while preserving chronological DOM order for accessibility.

**Interrupted row reveals finish before the next reveal starts.** Rapid submissions can append a new history row while the previous row's GSAP `from()` timeline still owns inline transform/opacity styles. HistoryArea advances the previous reveal timeline to its end before killing it, so older rows never remain visually half-revealed.

**Engine results pass through directly.** History tiles do not map `CharacterResult` into a separate UI tone type; `BaseTile` owns the visual treatment for each engine result.

**No dispatch or interaction.** HistoryArea is purely display. All state changes originate from Pool and SubmissionArea; HistoryArea only reflects history that has already been committed to state.
