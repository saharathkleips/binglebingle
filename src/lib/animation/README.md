# animation

GSAP animation utilities for tile drag interactions. Registers GSAP plugins once at import time and exports typed helpers for drag lifecycle animations.

## Exports

- `gsap` — re-exported GSAP instance (with plugins registered)
- `Draggable` — re-exported GSAP Draggable class (registered)
- `useGSAP` — re-exported `@gsap/react` hook for scoped animation cleanup in React components
- `animatePickUp(element) => gsap.core.Tween` — scales tile up with enhanced shadow on drag start
- `animatePutDown(element) => gsap.core.Tween` — scales tile back to rest and clears transforms on complete
- `animateReposition(element, x, y) => gsap.core.Tween` — smoothly moves tile to a new position offset
