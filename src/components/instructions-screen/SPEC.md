# SPEC: instructions-screen

**Status:** stable

## Purpose

InstructionsScreen is a full-screen overlay that explains the core game mechanic
to new players. It is shown automatically on first load and can be reopened via
the NavBar "?" button. The component is purely presentational — open/close state
lives in the parent (`App`).

**Data flow:** receives `isOpen` and `onClose` props from `App`; calls `onClose`
when the player dismisses the screen. No game state is read.

## File Map

```
instructions-screen/
├── InstructionsScreen.tsx          # component
├── InstructionsScreen.module.css   # styles
├── InstructionsScreen.test.tsx     # unit tests
├── README.md                       # public API
└── SPEC.md                         # this file
```

## Types

```ts
type InstructionsScreenProps = {
  isOpen: boolean;
  onClose: () => void;
};
```

## Component

### InstructionsScreen({ isOpen, onClose })

Renders a full-viewport overlay that walks the player through a worked example of
guessing the word **왜가리**, layering one concept per step:

1. **Compose (조합):** ㄱ + ㅏ compose into 가; submitted as a guess — result is
   absent. Introduces the core compose mechanic.
2. **Rotate (회전):** ㅏ → ㅗ demonstrates rotation; the guess 오가로 is submitted
   (가 is correct in position 2). Notes that guesses don't need to be real words.
3. **Answer:** 왜가리 — all correct, showing the win state.
4. **Decompose tip:** "if you mess up, tap to decompose" — explains how to undo a
   composed syllable.

When `isOpen` is `false` the overlay renders nothing (returns `null`).

A "알겠어요!" dismiss button calls `onClose`. Clicking the backdrop (the area
outside the card) also calls `onClose` so players can tap away.

The overlay uses `role="dialog"` and `aria-modal="true"` for accessibility.
`aria-label="Game instructions"` identifies the dialog to screen readers.

## Key Decisions

- **Worked example over mechanic list:** The original design listed rotate /
  combine / compose as three abstract steps. The reviewer requested a narrative
  that layers concepts through a real guess sequence (왜가리), which is more
  scannable and immediately grounded in the actual game loop.
- **Returns `null` when closed** rather than using CSS visibility/display, so the
  DOM is clean and focus management is trivial (no hidden focusable elements).
- **Backdrop click dismisses**: standard overlay UX; avoids requiring players to
  find the button. Stop-propagation on the card prevents backdrop handler firing
  when the card itself is clicked.
- **No internal state**: open/close state owned by `App` so NavBar and the
  overlay stay in sync without an additional context layer.
- **First-load show**: `App` initializes `isInstructionsOpen` to `true` so the
  overlay appears immediately. The player dismisses it once; subsequent visits
  within the same session require pressing "?" to reopen.
