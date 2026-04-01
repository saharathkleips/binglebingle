# plan-ui.md
> UI Domain — Implementation Plan
> Depends on: plan-models.md, plan-game.md, plan-engine.md
> Status: draft — awaiting review

---

## Scope

This document covers component structure, interaction model, and data flow. Visual design and styling are out of scope for MVP — components should render functionally correct, unstyled or minimally styled HTML.

---

## Component Tree

```
App
├── [loading screen — while setupGame() is pending]
└── GameProvider
    ├── Board
    │   └── GuessRow (× guesses.length)
    │       └── EvaluatedTile (× word length)
    ├── SubmissionRow
    │   └── SubmissionSlot (× word length)
    │       └── Token (when filled)
    ├── Pool
    │   └── Token (× pool.length)
    └── Controls
        ├── SubmitButton
        └── ResetButton
```

---

## App

**File**: `src/App.tsx`

Responsible for loading the game before anything else renders. Calls `setupGame()` on mount, holds the result, renders a loading state while pending and the `GameProvider` tree once resolved.

```typescript
export function App() {
  const [initialState, setInitialState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setupGame(devSettings.strategy)
      .then(setInitialState)
      .catch(e => setError(String(e)))
  }, [])

  if (error) return <div>Failed to load game: {error}</div>
  if (!initialState) return <div>Loading…</div>
  return <GameProvider initialState={initialState}> <Game /> </GameProvider>
}
```

Dev settings are held in `App` local state (not game state). A dev panel toggled by a key combination or URL param (`?dev=1`) allows changing the selection strategy and re-calling `setupGame`.

---

## Game

**File**: `src/components/Game.tsx`

The root game component. Reads `useGame()` and orchestrates layout. No logic — just composition.

```typescript
export function Game() {
  return (
    <>
      <Board />
      <SubmissionRow />
      <Pool />
      <Controls />
    </>
  )
}
```

---

## Board

**File**: `src/components/Board/Board.tsx`

Renders the history of submitted guesses. One `GuessRow` per entry in `state.guesses`.

```typescript
// Reads: state.guesses, state.word
// Dispatches: nothing
```

### GuessRow

One row per `GuessRecord`. One `EvaluatedTile` per `EvaluatedCharacter`.

### EvaluatedTile

Displays a single evaluated character. Receives `character: string` and `result: CharacterResult`. An empty slot (`character === ''`) renders a blank tile. The `result` prop drives the visual state (`correct` / `present` / `absent`) — styling deferred.

---

## SubmissionRow

**File**: `src/components/SubmissionRow/SubmissionRow.tsx`

Renders the current guess being built. One `SubmissionSlot` per position in the target word, always fixed length.

```typescript
// Reads: state.submission, state.word
// Dispatches: REMOVE_FROM_SLOT
```

### SubmissionSlot

A single slot in the current guess. Two states:
- **Empty**: renders a placeholder. Acts as a drop target (accepts tokens dragged from the pool) and a tap target (if a pool token is selected, tapping an empty slot places it here).
- **Filled**: renders the `Token` currently occupying the slot. Tapping or pressing an action on the token removes it back to the pool (`REMOVE_FROM_SLOT`).

The slot always knows its `slotIndex` and passes it down.

---

## Pool

**File**: `src/components/Pool/Pool.tsx`

Renders all tokens currently in `state.pool`. This is the player's primary working area.

```typescript
// Reads: state.pool
// Dispatches: (via Token interactions) ROTATE_TOKEN, COMBINE_TOKENS, SPLIT_TOKEN, PLACE_TOKEN
```

Tokens in the pool are draggable (to submission slots or onto other tokens). Tokens also respond to tap interactions.

---

## Token

**File**: `src/components/Token/Token.tsx`

The fundamental interactive element. Appears in both `Pool` and `SubmissionRow` contexts. Its behaviour differs by context.

```typescript
type TokenProps = {
  tokenId: number
  character: Character
  context: 'pool' | 'submission'
  slotIndex?: number          // defined when context === 'submission'
}
```

### What a Token displays

Calls `resolveCharacter(character)` and displays the result. If `resolveCharacter` returns null (invalid intermediate state — should not occur given reducer invariants), displays the raw jamo joined as a string as a fallback.

### Token interactions

This is the core UX surface. The exact gestures are open for iteration, but the following model is proposed for MVP:

**Tap (single tap):**
- Pool token, not selected → **select** it (highlight it as the active token)
- Pool token, already selected → **deselect**
- Pool token, when another token is already selected → **combine** the two (`COMBINE_TOKENS`); deselect both regardless of result
- Empty submission slot, when a pool token is selected → **place** the selected token (`PLACE_TOKEN`)
- Filled submission slot token → **remove** it back to pool (`REMOVE_FROM_SLOT`)

**Rotate button / secondary tap:**
A dedicated rotate affordance on the token (e.g. a small button, or a long press). Fires `ROTATE_TOKEN` with the next rotation target from `getNextRotation`. If the token is not rotatable, the affordance is hidden or disabled.

**Split button / secondary tap:**
A dedicated split affordance. Fires `SPLIT_TOKEN`. Hidden or disabled if `character.jamo.length <= 1`.

**Drag:**
Pool tokens are draggable. Dragging a token onto another pool token attempts `COMBINE_TOKENS`. Dragging a token onto an empty submission slot fires `PLACE_TOKEN`. Dragging onto a filled submission slot is a no-op for MVP (swap behaviour deferred).

> **Note**: drag and tap interactions must coexist. On mobile, a tap that becomes a drag should not also fire the tap handler. `@dnd-kit/core` handles this via its pointer sensor with a distance threshold — a drag only activates after a small movement, leaving short taps to the tap handler.

### Selection state

A single selected token id is held in local `Pool` component state (not game state — selection is transient UI state with no game meaning). Passed down to each `Token` as an `isSelected` prop.

```typescript
// In Pool.tsx
const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
```

---

## Controls

**File**: `src/components/Controls/Controls.tsx`

```typescript
// Reads: state.submission, state.guesses, state.word (via useGame)
// Dispatches: SUBMIT_GUESS (after evaluating), RESET_ROUND
```

### SubmitButton

Calls `canSubmit(state.submission)` on each render. Disabled when `canSubmit` returns `{ valid: false }`. On click:
1. Call `evaluateGuess(state.submission, state.word)` to get the `GuessRecord`
2. Check `isWon` on the result
3. Dispatch `SUBMIT_GUESS` with the evaluation
4. If won, show the results screen (local state in `App` or `Game`)

### ResetButton

Dispatches `RESET_ROUND`. Clears pool and submission back to round-start state without affecting guess history.

---

## Results Screen

**File**: `src/components/ResultsScreen.tsx`

Shown when `isWon(state)` is true. Displays:
- The target word
- The number of guesses taken (`calculateScore(state.guesses).guessCount`)
- The full guess history (reuses `Board` or a simplified version)

Triggered by the `Game` component watching `isWon(state)`:

```typescript
// In Game.tsx
const { state } = useGame()
if (isWon(state)) return <ResultsScreen />
```

---

## Data Flow Summary

```
setupGame()
  └── createInitialGameState(word)
        └── GameProvider (initialState)
              └── useGame() → { state, dispatch }

state.pool          → Pool → Token (pool context)
state.submission    → SubmissionRow → SubmissionSlot → Token (submission context)
state.guesses       → Board → GuessRow → EvaluatedTile

Token tap/drag
  → ROTATE_TOKEN
  → COMBINE_TOKENS
  → SPLIT_TOKEN
  → PLACE_TOKEN
  → REMOVE_FROM_SLOT

SubmitButton click
  → canSubmit(state.submission)       [engine]
  → evaluateGuess(state.submission, state.word)  [engine]
  → dispatch(SUBMIT_GUESS)

isWon(state) === true
  → ResultsScreen
```

---

## File Map

```
src/
├── App.tsx
├── components/
│   ├── Game.tsx
│   ├── Board/
│   │   ├── Board.tsx
│   │   ├── GuessRow.tsx
│   │   └── EvaluatedTile.tsx
│   ├── SubmissionRow/
│   │   ├── SubmissionRow.tsx
│   │   └── SubmissionSlot.tsx
│   ├── Pool/
│   │   └── Pool.tsx
│   ├── Token/
│   │   └── Token.tsx
│   ├── Controls/
│   │   ├── Controls.tsx
│   │   ├── SubmitButton.tsx
│   │   └── ResetButton.tsx
│   └── ResultsScreen.tsx
```

`Token` is its own top-level component folder because it is used in multiple contexts. Everything else is scoped to its parent.

---

## ⚑ Open UX Questions

These are decisions that will affect implementation but depend on how the game feels to play. They do not need to be answered before the agent starts — the component structure supports iteration on all of them.

**U1 — Rotate gesture**
Current proposal: a dedicated small rotate button on each rotatable token. Alternative: long press on the token rotates it. Which feels better on mobile?

**U2 — Combine gesture**
Current proposal: tap-to-select then tap-another-to-combine, plus drag-onto for pointer users. Is there a cleaner single-gesture model?

**U3 — Split gesture**
Current proposal: a dedicated split button on multi-jamo tokens. When should split be available — always, or only when the token is in the pool (not in a submission slot)?

**U4 — Slot placement**
Current proposal: tap selected token → tap empty slot to place. Should placing also be possible by dragging directly from pool to slot? (Yes per architecture.md, but the tap model is primary on mobile.)

**U5 — Can incomplete characters be placed in submission slots?**
Confirmed as a UX question in plan-models.md. For MVP: allow placement but disable submit (the `canSubmit` gate handles this). This lets players "reserve" a slot while still building the character.

**U6 — Visual feedback for invalid actions**
When a combine attempt produces no result (no rule exists), should there be feedback (brief shake, flash) or silent no-op? For MVP: silent no-op is fine — revisit when styling begins.
