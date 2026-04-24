# SPEC: animation

**Status:** draft

## Purpose

Centralizes GSAP plugin registration and provides typed animation helpers for tile drag interactions. Components import from this module to get a ready-to-use GSAP instance with Draggable registered, plus helper functions that encode animation parameters (duration, easing, scale) without knowing about game logic.

## File Map

```
animation/
├── README.md
├── SPEC.md
├── register.ts           # GSAP plugin registration + re-exports
├── drag-animations.ts    # animatePickUp, animatePutDown, animateReposition
└── drag-animations.test.ts
```

## Types

No custom types exported. Functions accept `HTMLElement` targets and return `gsap.core.Tween`.

## Functions

### animatePickUp(element) => gsap.core.Tween

Scales element to 1.08 with an enhanced box-shadow over 0.15s. Called from GSAP Draggable's `onDragStart`. Does not clear transforms — Draggable manages position transforms during drag.

### animatePutDown(element) => gsap.core.Tween

Scales element back to 1 with resting box-shadow over 0.2s (ease: power2.out). On complete, clears all inline GSAP styles (`clearProps: "all"`). Used on successful drops where React state changes will re-render the element.

### animateReposition(element, x, y) => gsap.core.Tween

Animates element to the given x/y transform offset over 0.3s (ease: power2.out). Used when a drop has no valid target or a compose is rejected — the tile settles near where it was dropped rather than snapping back to origin. Designed to be reusable for decomposition spread in 1.4.5.

## Key Decisions

- Plugin registration runs once at module load time via top-level `gsap.registerPlugin(Draggable, useGSAP)` in `register.ts`. Components that need Draggable import from `register.ts` to guarantee registration order.
- `useGSAP` from `@gsap/react` wraps `useLayoutEffect` and creates a `gsap.Context` scoped to a container ref. All GSAP objects created inside the callback are auto-reverted on unmount. Animations created in event callbacks (Draggable's `onDragStart`, `onDragEnd`) must be wrapped with `contextSafe` to be tracked for cleanup.
- Animation helpers are thin wrappers over `gsap.to()` — they encode timing and easing parameters but receive targets from callers. No game logic awareness.
- `animatePutDown` uses `clearProps: "all"` on complete so React's next render starts from a clean slate.

---

## Open Questions

- Should `animateReposition` also scale back to 1, or does the caller handle that separately? Currently it handles both position and scale reset for simplicity.
