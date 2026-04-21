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

Renders a full-viewport overlay with three phases, each showing 3 slots. The
example word is **왜가리** (pool: ㅇ ㄱ ㄹ ㅏ ㅏ ㅏ ㅣ ㅣ).

1. **Compose phase:** Pool tiles shown at top. Inline example: ㄱ + ㅏ = 가.
   Copy: "Drag and drop to combine." Slots: [가 present] [empty] [empty].
2. **Rotate phase:** Inline example: ㅏ → ㅗ. Copy: "Tap to rotate." Slots:
   [오 absent] [가 correct] [로 absent]. Note: "Guesses don't need to be real words."
3. **Deconstruct phase:** Copy: "Tap to deconstruct." Slots: [왜 correct]
   [가 correct] [리 correct] — the final winning answer.

When `isOpen` is `false` the overlay renders nothing (returns `null`).

A "알겠어요!" dismiss button calls `onClose`. Clicking the backdrop (the area
outside the card) also calls `onClose` so players can tap away.

The overlay uses `role="dialog"` and `aria-modal="true"` for accessibility.
`aria-label="Game instructions"` identifies the dialog to screen readers.

## Key Decisions

- **Three phases, always 3 slots:** Each phase mirrors the actual submission row
  so the player immediately recognises the layout. The narrative arc is:
  compose → rotate → deconstruct → win.
- **왜가리 as example word:** Its jamo decompose cleanly from the basic pool
  (ㅏ×3, ㅣ×2) — one ㅏ rotates to ㅗ for guess 2, the rest build 왜 and 가/리.
- **Short imperative copy:** "Drag and drop to combine." / "Tap to rotate." /
  "Tap to deconstruct." — game-appropriate tone, no paragraph explanations.
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
