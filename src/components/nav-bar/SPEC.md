# SPEC: nav-bar

**Status:** stable

## Purpose

NavBar is a presentational shell component that renders on every screen. It displays
the abbreviated game logo and provides a button to open/close the InstructionsScreen overlay.
No game state is read — all behavior flows through props.

## File Map

```
nav-bar/
├── NavBar.tsx          # component
├── NavBar.module.css   # styles
├── NavBar.test.tsx     # unit tests
├── README.md           # public API
└── SPEC.md             # this file
```

## Types

```ts
type NavBarProps = {
  onToggleInstructions: () => void;
  isInstructionsOpen: boolean;
};
```

## Component

### NavBar({ onToggleInstructions, isInstructionsOpen })

Renders a top bar containing:

- A heading with the abbreviated `ㅂㄱㅂㄱ` logo
- A button labeled "?" that calls `onToggleInstructions` on click

`isInstructionsOpen` is forwarded to the button's `aria-expanded` attribute so
assistive technology knows the current overlay state.

## Key Decisions

- Props-only: NavBar has no internal state and does not read from `useGame()`.
  The toggle state lives one level up (Game.tsx or App.tsx), so the same NavBar
  instance can be reused without any context coupling.
- The logo reuses the default tile iridescent palette, black face, rounded radius,
  and faux-depth shadow, but keeps its dimensions, font variables, border thickness,
  and left-to-right text gradient local because it is brand chrome rather than a playable tile.
- `isInstructionsOpen` kept as a prop (vs. omitting) because `aria-expanded`
  needs it and future styling (active indicator) will want it.
