# animation

GSAP animation utilities for tile interactions. Registers GSAP plugins once at import time and exports typed helpers for drag lifecycle, tile feedback, history reveal, and particle animations.

## Exports

- `gsap` — re-exported GSAP instance (with plugins registered)
- `Draggable` — re-exported GSAP Draggable class (registered)
- `useGSAP` — re-exported `@gsap/react` hook for scoped animation cleanup in React components
- `animatePickUp(element) => gsap.core.Tween` — scales tile up on drag start
- `animateReposition(element, onComplete?) => gsap.core.Tween` — snaps a dragged tile back to its origin
- `recordTileSnapBack(tileId, element, options?)`, `hasPendingTileSnapBack(tileId)`, `popPendingTileSnapBack(tileId)`, `discardPendingTileSnapBack(tileId)` — capture, consume, or discard release snapshots when React moves a tile between owners
- `shouldSuppressTileEntranceForSnapBack(tileId)`, `clearTileEntranceSnapBackSuppressions(tileIds)` — prevent generic entrance animations from competing with snap-back clones
- `animateSnapBackFromRect(element, snapshot, onComplete?) => gsap.core.Tween` — animates a captured tile clone into a newly-rendered destination tile's layout position using the shared snap-back timing
- `animateComposePulse(element, onComplete?) => gsap.core.Tween` — plays compose feedback on a tile
- `animateEntranceScale(element, onComplete?, options?) => gsap.core.Tween` — scales a newly-rendered tile in from a configurable starting scale
- `animateHistoryRowReveal(rowElement) => gsap.core.Timeline` — reveals a submitted history row and staggers its tiles
- `animateParticleBurst(element) => () => void` — emits removable fixed-position particles from a tile center
