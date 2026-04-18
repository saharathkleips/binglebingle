# SPEC: components/composer

**Status:** draft

## Purpose

Renders the submission row and submit button. Player places tiles into slots, sees resolved characters, and submits guesses.

**Boundaries:**

- Reads from: `useGame()` (state.submission)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/lib/character/` for `resolveCharacter`, `src/lib/engine/validate` for `canSubmit`

## File Map

```
composer/
├── Composer.tsx              # Container — maps slots + submit button
├── Composer.module.css       # Flex layout for slots row
├── SubmissionSlot.tsx        # Single slot — empty or filled
├── SubmissionSlot.module.css # Slot styling (dashed empty, solid filled)
├── SubmitButton.tsx          # Validates and dispatches submit
├── Composer.test.tsx
├── SubmissionSlot.test.tsx
├── SubmitButton.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### Composer

Reads `state.submission` from `useGame()` and renders a `SubmissionSlot` for each slot, plus a `SubmitButton`. Passes `dispatch` down as props.

### SubmissionSlot

Renders a single slot. Empty slots show a dashed placeholder. Filled slots display `resolveCharacter(slot.character)` and dispatch `SUBMISSION_SLOT_REMOVE` on tap.

Filled slots also act as drag sources: dragging a filled slot onto another slot dispatches `SUBMISSION_SLOT_MOVE`, swapping the two tiles (or moving into an empty slot). A 4px movement threshold distinguishes tap from drag, matching Token's behavior. Drop targets are identified by `data-slot-index`; the slot never drops onto itself.

### SubmitButton

Calls `canSubmit(submission)` to determine validity. Disabled when invalid; dispatches `ROUND_SUBMISSION_SUBMIT` on click when valid.

## Key Decisions

**Dispatch passed as prop.** Same rationale as Token — keeps sub-components testable without providers.

**canSubmit gates the button, not placement.** Incomplete characters can be placed in slots per the game spec; validation only happens at submit time.
