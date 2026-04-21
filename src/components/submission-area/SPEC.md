# SPEC: components/submission-area

**Status:** stable

## Purpose

Renders the submission row and submit button. Player places tiles into slots, sees resolved characters, and submits guesses.

**Boundaries:**

- Reads from: `useGame()` (state.submission)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/character/` for `resolveCharacter`, `src/lib/engine/validate` for `canSubmit`

## File Map

```
submission-area/
├── SubmissionArea.tsx              # Container — maps slots + submit button
├── SubmissionArea.module.css       # Flex layout for slots row
├── SubmissionSlot.tsx              # Single slot — empty or filled
├── SubmissionSlot.module.css       # Slot styling (dashed empty, solid filled)
├── SubmissionButton.tsx            # Validates and dispatches submit
├── SubmissionArea.test.tsx
├── SubmissionSlot.test.tsx
├── SubmissionButton.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### SubmissionArea

Reads `state.submission` from `useGame()` and renders a `SubmissionSlot` for each slot, plus a `SubmissionButton`. Passes `dispatch` down as props.

### SubmissionSlot

Renders a single slot. Empty slots show a dashed placeholder. Filled slots display `resolveCharacter(slot.character)` and dispatch `SUBMISSION_SLOT_REMOVE` on tap.

Filled slots also act as drag sources: dragging a filled slot onto another slot dispatches `SUBMISSION_SLOT_MOVE`, swapping the two tiles (or moving into an empty slot). A 4px movement threshold distinguishes tap from drag, matching Tile's behavior. Drop targets are identified by `data-slot-index`; the slot never drops onto itself.

### SubmissionButton

Calls `canSubmit(submission)` to determine validity. Disabled when invalid; dispatches `ROUND_SUBMISSION_SUBMIT` on click when valid.

## Key Decisions

**Callbacks over dispatch in SubmissionSlot.** Mirrors the Tile/Pool boundary — SubmissionSlot owns pointer/drag mechanics and surfaces semantic callbacks (`onTap`, `onDropOnSlot`); SubmissionArea translates those into dispatch calls. Keeps SubmissionSlot testable with plain function spies and free of game-action knowledge.

**canSubmit gates the button, not placement.** Incomplete characters can be placed in slots per the game spec; validation only happens at submit time.
