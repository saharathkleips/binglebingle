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

Renders a full-viewport overlay with two phases, each showing 3 slots:

1. **Pool phase:** Displays the pool of jamo tiles. Copy: "Use the pool of jamo
   to guess the word." / "Drag and drop to combine." Three empty slots shown
   below to illustrate the submission area.
2. **Rotate phase:** Shows ㅏ → ㅗ rotation inline. Copy: "Tap to rotate." Three
   result tiles (오 absent, 가 correct, 로 absent) demonstrate a submitted guess.
   "Guesses don't need to be real words." note follows.

When `isOpen` is `false` the overlay renders nothing (returns `null`).

A "알겠어요!" dismiss button calls `onClose`. Clicking the backdrop (the area
outside the card) also calls `onClose` so players can tap away.

The overlay uses `role="dialog"` and `aria-modal="true"` for accessibility.
`aria-label="Game instructions"` identifies the dialog to screen readers.

## Key Decisions

- **Two phases, always 3 slots:** Each phase mirrors the actual game layout
  (3-character words) so the player immediately recognises the submission area.
  Empty slots in phase 1 introduce the concept; filled result tiles in phase 2
  show what feedback looks like.
- **Short imperative copy:** "Drag and drop to combine." / "Tap to rotate." —
  game-appropriate tone, no paragraph explanations.
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
