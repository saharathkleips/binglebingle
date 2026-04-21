# instructions-screen

Full-screen overlay that explains the rotate → combine → compose mechanic to new
players. Shown automatically on first load; reopenable via the NavBar "?" button.

## Exports

- `InstructionsScreen({ isOpen, onClose })` — renders the overlay when `isOpen`
  is `true`; calls `onClose` when the player taps "Got it" or the backdrop;
  returns `null` when closed
