# nav-bar

Top navigation bar rendered on every screen. Displays the abbreviated game logo and circular action buttons.

## Exports

- `NavBar({ onToggleInstructions, isInstructionsOpen })` — renders the `ㅂㄱㅂㄱ` logo, three
  difficulty placeholders (`삼`, `사`, `오`), an instructions toggle, and a settings button;
  calls `onToggleInstructions` from the instructions button; sets `aria-expanded` from
  `isInstructionsOpen`
- `NavActionButton({ ariaLabel, label | icon, isExpanded, onClick })` — shared circular
  neo-brutalist nav action with the submission button surface depth, press animation, and text/icon
  label treatment
