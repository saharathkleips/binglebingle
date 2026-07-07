# SPEC: nav-bar

**Status:** stable

## Purpose

NavBar is a presentational shell component that renders on every screen. It displays
the abbreviated game logo and provides circular action buttons for instructions, settings, and
future difficulty selection. No game state is read — all behavior flows through props.

## File Map

```
nav-bar/
├── NavBar.tsx                    # component
├── NavBar.module.css             # layout styles
├── NavActionButton.tsx           # shared circular action button
├── NavActionButton.module.css    # action button surface, depth, and label styles
├── NavBar.test.tsx               # unit tests
├── gear.svg                      # settings button icon
├── README.md                     # public API
└── SPEC.md                       # this file
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
- Three future difficulty placeholder buttons labeled `삼`, `사`, and `오`
- A button labeled "?" that calls `onToggleInstructions` on click
- A settings placeholder button using colocated `gear.svg`

`isInstructionsOpen` is forwarded to the button's `aria-expanded` attribute so
assistive technology knows the current overlay state.

## Key Decisions

- Props-only: NavBar has no internal state and does not read from `useGame()`.
  The toggle state lives one level up (Game.tsx or App.tsx), so the same NavBar
  instance can be reused without any context coupling.
- The logo reuses the default tile iridescent palette, black face, rounded radius,
  and fixed system faux-depth shadow, but keeps its dimensions, font variables, border thickness,
  and left-to-right text gradient local because it is brand chrome rather than a playable tile.
- Nav action buttons are ordered as difficulty controls first (`삼`, `사`, `오`), then a visual gap,
  then instructions and settings. Each button uses an inner circular surface so the native button hit
  area stays stable while the visual face lifts and presses with the same fixed system shadow stack
  and translations as SubmissionButton. Their labels duplicate the SubmissionButton
  gradient/stroke/depth treatment so future chrome buttons can inherit updates from one component.
- Nav chrome defaults to a 44px button footprint; compact width/height breakpoints tighten the button
  footprint, inner circular faces, logo, and gaps so the bar fits cramped screens without the faces
  feeling visually over-spaced.
- The nav content is capped and centered inside the full-width bar so logo/actions use edge spacing on
  narrow screens but do not drift to opposite viewport edges on very wide screens.
- `isInstructionsOpen` kept as a prop (vs. omitting) because `aria-expanded`
  needs it and future styling (active indicator) will want it.
