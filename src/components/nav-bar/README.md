# nav-bar

Top navigation bar rendered on every screen. Displays the game title and a button
to open or close the InstructionsScreen overlay.

## Exports

- `NavBar({ onToggleInstructions, isInstructionsOpen })` — renders the title and a
  "?" toggle button; calls `onToggleInstructions` on click; sets `aria-expanded` from
  `isInstructionsOpen`
