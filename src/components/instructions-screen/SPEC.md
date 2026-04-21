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

Renders a full-viewport overlay explaining the three mechanics in order:

1. **Rotate (회전):** A jamo tile can be rotated into a related form.
   Example: ㄱ → ㄴ → ㄷ
2. **Combine (결합):** Two jamo of the same type can combine into a compound
   form. Example: ㄱ + ㄱ = ㄲ, ㅗ + ㅏ = ㅘ
3. **Compose (조합):** A choseong and jungseong (plus optional jongseong) combine
   into a syllable block. Example: ㅂ + ㅏ + ㅂ = 밥

When `isOpen` is `false` the overlay renders nothing (returns `null`).

A "Got it" dismiss button calls `onClose`. Clicking the backdrop (the area
outside the card) also calls `onClose` so players can tap away.

The overlay uses `role="dialog"` and `aria-modal="true"` for accessibility.
`aria-label="Game instructions"` identifies the dialog to screen readers.

## Key Decisions

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
