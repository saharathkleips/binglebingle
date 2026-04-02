# plan-ui.md
> UI Domain — Implementation Plan
> Depends on: plan-models.md, plan-game.md, plan-engine.md
> Status: draft — awaiting review

---

## Scope

Component structure, interaction model, and data flow. Visual design and styling are deferred — components should render functionally correct with minimal or no styling for MVP. The exception is the token shake animation (U6), which is required even in MVP to confirm invalid actions are detected.

---

## Component Tree

```
App
├── NavBar
├── InstructionsScreen   [shown on first load and on demand; dismissible]
└── GameProvider
    └── Game
        ├── Board
        │   └── GuessRow (× guesses.length)
        │       └── EvaluatedTile (× word length)
        ├── SubmissionRow
        │   └── SubmissionSlot (× word length)
        ├── Pool                          [transforms to win state when isWon]
        │   └── Token (× pool.length)
        └── Controls
            ├── SubmitButton              [becomes ShareButton when isWon]
            └── ResetButton
```

---

## App

**File**: `src/App.tsx`

Starts `setupGame()` immediately on mount. Shows `InstructionsScreen` while loading — by the time the player dismisses instructions, the game is typically ready. If it isn't, a brief inline loading indicator appears where the game will be.

```typescript
export function App() {
  const [initialState, setInitialState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    setupGame(devSettings.strategy)
      .then(setInitialState)
      .catch(e => setError(String(e)))
  }, [])

  return (
    <>
      <NavBar onShowInstructions={() => setShowInstructions(true)} />
      {showInstructions && (
        <InstructionsScreen onDismiss={() => setShowInstructions(false)} />
      )}
      {error && <div>Failed to load: {error}</div>}
      {!error && !initialState && !showInstructions && <div>Loading…</div>}
      {initialState && (
        <GameProvider initialState={initialState}>
          <Game />
        </GameProvider>
      )}
    </>
  )
}
```

Dev settings (`DevSettings`) live in `App` local state. A dev panel is accessible via `?dev=1` URL param, allowing strategy override and game reset without a full page reload.

---

## NavBar

**File**: `src/components/NavBar.tsx`

Persistent across all states. Contains:
- Game name (left)
- Instructions button — re-shows `InstructionsScreen` (right)
- Settings button — opens a settings panel (placeholder for MVP; panel is empty) (right)

```typescript
type NavBarProps = {
  onShowInstructions: () => void
}
```

---

## InstructionsScreen

**File**: `src/components/InstructionsScreen.tsx`

Shown on first load and when the instructions button is tapped. Overlays or replaces the game area. Contains:
- Brief explanation of the game
- Examples of rotation (show ㄱ → ㄴ)
- Examples of combination (show ㅏ + ㅣ → ㅐ)
- Examples of submission and tile results (`correct` / `present` / `absent`)
- Dismiss button ("Play" on first load, "Close" when re-opened mid-game)

```typescript
type InstructionsScreenProps = {
  onDismiss: () => void
}
```

No game state is read here — instructions are static content.

---

## Game

**File**: `src/components/Game.tsx`

Root game component. Reads `useGame()` and decides what to render based on win state.

```typescript
export function Game() {
  const { state } = useGame()
  const won = isWon(state)

  return (
    <>
      <Board />
      <SubmissionRow />
      <Pool won={won} />
      <Controls won={won} />
    </>
  )
}
```

When `won` is true, `Pool` renders a win state and `Controls` renders a share affordance. No separate results screen — the game area transforms in place.

---

## Board

**File**: `src/components/Board/Board.tsx`

Renders the history of submitted guesses. One `GuessRow` per `GuessRecord` in `state.guesses`.

```typescript
// Reads: state.guesses
// Dispatches: nothing
```

### GuessRow

One row per `GuessRecord` (array of `EvaluatedCharacter`).

### EvaluatedTile

Displays one `EvaluatedCharacter`. Props: `character: string`, `result: CharacterResult`. Empty slot (`character === ''`) renders a blank placeholder. Result drives visual state — styling deferred.

---

## SubmissionRow

**File**: `src/components/SubmissionRow/SubmissionRow.tsx`

Fixed-length row of slots matching `[...state.word].length`. Each slot is either empty or contains a token.

```typescript
// Reads: state.submission
// Dispatches: REMOVE_FROM_SLOT (via slot tap or drag-out)
```

### SubmissionSlot

**Empty slot**: a drop target. Accepts tokens dragged from the pool. On drop, dispatches `PLACE_TOKEN`.

**Filled slot**: renders the token's current character (via `resolveCharacter`). Two ways to remove:
- **Tap** the filled slot → dispatches `REMOVE_FROM_SLOT`
- **Drag** the token out of the slot back toward the pool → dispatches `REMOVE_FROM_SLOT`

Filled slots are therefore both drag sources and drop targets. A drag that starts on a filled slot and ends anywhere other than another empty slot returns the token to the pool.

Slots do not use the `Token` component — they are simpler display elements that only need to show the resolved character and handle removal. The full `Token` interaction model (rotate, split) is pool-only.

---

## Pool

**File**: `src/components/Pool/Pool.tsx`

The player's primary working area. Renders all tokens in `state.pool` as interactive `Token` components.

```typescript
type PoolProps = { won: boolean }

// Reads: state.pool
// Dispatches: (via Token) ROTATE_TOKEN, COMBINE_TOKENS, SPLIT_TOKEN, PLACE_TOKEN
```

When `won` is true, the pool renders a win state — score (`calculateScore(state.guesses)`) and the target word displayed in or adjacent to the pool area. The Board remains fully visible and non-interactive; the final guess row already shows all `'correct'` tiles, effectively revealing the target word.

---

## Token

**File**: `src/components/Token/Token.tsx`

The core interactive element. Only appears in the pool.

```typescript
type TokenProps = {
  tokenId: number
  character: Character
}
```

### Display

Calls `resolveCharacter(character)` and displays the result. Every valid token state the reducer can produce is guaranteed to resolve — the reducer's no-op invariants ensure no token ever holds an unresolvable character. The only tokens in the pool are:

- Single basic jamo: `['ㄱ']` → displays `'ㄱ'`
- Single combined jamo: `['ㅐ']` → displays `'ㅐ'` (already resolved by prior combine)
- Partial syllable (cho + jung): `['ㄱ','ㅏ']` → displays `'가'`
- Complete syllable (cho + jung + jong): `['ㄱ','ㅏ','ㄱ']` → displays `'각'`

`resolveCharacter` handles all of these. No null fallback is needed in practice.

### Tap interaction

**Single tap on a rotatable token** (single basic jamo that is in a rotation set):
→ `ROTATE_TOKEN` with `targetJamo = getNextRotation(character.jamo[0])`

**Single tap on a non-rotatable / multi-jamo token** (complex vowel, double consonant, partial syllable, complete syllable):
→ `SPLIT_TOKEN` — decomposes the last jamo by one step

This covers all token states cleanly:
- Basic non-rotatable jamo (ㅎ, ㄷ, etc.): tap does nothing (no rotate, no split — single jamo cannot split). The token is inert to taps; drag-only.
- Rotatable jamo (ㄱ, ㅏ, etc.): tap rotates.
- Everything else: tap splits.

### Drag interaction

Tokens are draggable via `@dnd-kit/core` with a pointer and touch sensor. A drag only activates after a small movement threshold, so short taps fire the tap handler without interference.

**Drag onto another pool token**: attempt combine.
1. Check validity before dispatching: call `combineJamo(a, b)` or `upgradeJongseong(existing, additional)` based on context (see plan-game.md `COMBINE_TOKENS` branching).
2. If valid → dispatch `COMBINE_TOKENS`.
3. If invalid → **do not dispatch**; trigger shake animation on the dragged token instead.

**Drag onto an empty submission slot**: dispatch `PLACE_TOKEN`.

**Drag onto a filled submission slot**: no-op for MVP.

### Shake animation

When a combine attempt is invalid (pre-dispatch check returns null), the token plays a brief CSS shake animation. This is the only animation required for MVP — it confirms to the player that the action was attempted and failed.

Implementation: a local boolean state `shaking` on the `Token` component. Set to `true` on invalid combine, reset to `false` via `onAnimationEnd`. Drives a CSS class.

```typescript
const [shaking, setShaking] = useState(false)

function handleInvalidCombine() {
  setShaking(true)
}

// On the token element:
// className={shaking ? 'token token--shake' : 'token'}
// onAnimationEnd={() => setShaking(false)}
```

The CSS animation itself is a simple translateX keyframe — trivial to add even without a full design pass.

---

## Controls

**File**: `src/components/Controls/Controls.tsx`

```typescript
type ControlsProps = { won: boolean }

// Reads: state.submission, state.guesses, state.word (via useGame)
// Dispatches: SUBMIT_GUESS, RESET_ROUND
```

### SubmitButton

When `won` is false:
- Calls `canSubmit(state.submission)` on each render
- Disabled when `canSubmit` returns `{ valid: false }`
- On click: call `evaluateGuess(state.submission, state.word)`, dispatch `SUBMIT_GUESS` with the result

When `won` is true:
- Renders as a "Share" placeholder button (no share functionality in MVP — button exists but is inert or shows a coming-soon message)

### ResetButton

Always present. Dispatches `RESET_ROUND`. Resets pool and submission to round-start state without clearing guess history.

---

## Data Flow Summary

```
App.mount → setupGame() [async, runs during InstructionsScreen]
  → createInitialGameState(word) → GameProvider(initialState)
    → useGame() → { state, dispatch }

state.pool        → Pool → Token (tap: rotate or split) (drag: combine or place)
state.submission  → SubmissionRow → SubmissionSlot (tap: remove) (drop: place)
state.guesses     → Board → GuessRow → EvaluatedTile

Token drag onto token
  → combineJamo / upgradeJongseong check
  → valid   → dispatch COMBINE_TOKENS
  → invalid → shake animation (no dispatch)

Token drag onto empty slot
  → dispatch PLACE_TOKEN

SubmissionSlot tap (filled)
  → dispatch REMOVE_FROM_SLOT

SubmitButton click
  → canSubmit(state.submission)
  → evaluateGuess(state.submission, state.word)
  → dispatch SUBMIT_GUESS

isWon(state) === true
  → Pool shows win state (score + word)
  → SubmitButton becomes Share placeholder
```

---

## File Map

```
src/
├── App.tsx
└── components/
    ├── NavBar.tsx
    ├── InstructionsScreen.tsx
    ├── Game.tsx
    ├── Board/
    │   ├── Board.tsx
    │   ├── GuessRow.tsx
    │   └── EvaluatedTile.tsx
    ├── SubmissionRow/
    │   ├── SubmissionRow.tsx
    │   └── SubmissionSlot.tsx
    ├── Pool/
    │   └── Pool.tsx
    ├── Token/
    │   └── Token.tsx
    └── Controls/
        ├── Controls.tsx
        ├── SubmitButton.tsx
        └── ResetButton.tsx
```

---

## Resolved UX Decisions

| # | Decision |
|---|---|
| U1 | Tap a rotatable token → rotate (cycles via `getNextRotation`) |
| U2 | Drag token onto another token → combine (validity checked pre-dispatch) |
| U3 | Tap a non-rotatable / multi-jamo token → split (one step via `decomposeJamo`) |
| U4 | Drag token onto empty submission slot → place |
| U5 | Incomplete tokens may be placed in submission slots; `canSubmit` gates submission |
| U6 | Invalid combine → shake animation on the dragged token; CSS only, required for MVP |
| UI1 | Single basic non-rotatable, non-splittable tokens are inert to taps — drag only, no tap feedback |
| UI2 | Dragging a filled submission slot token back toward the pool also dispatches `REMOVE_FROM_SLOT` — slots are both drop targets and drag sources |
| UI3 | On win, the pool area shows score and word overlaid or adjacent; the Board (guess history) remains fully visible and non-interactive since the final row shows the correct word |
