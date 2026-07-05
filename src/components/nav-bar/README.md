# nav-bar

Top navigation bar rendered on every screen. Displays the abbreviated game logo and a button
to open or close the InstructionsScreen overlay.

## Exports

- `NavBar({ onToggleInstructions, isInstructionsOpen })` — renders the `ㅂㄱㅂㄱ` logo and a
  "?" toggle button; calls `onToggleInstructions` on click; sets `aria-expanded` from
  `isInstructionsOpen`
