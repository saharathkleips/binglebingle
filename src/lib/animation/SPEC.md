# SPEC: animation

**Status:** draft

## Purpose

Centralizes GSAP plugin registration and provides typed animation helpers for tile drag interactions, tile feedback, history reveals, and particle effects. Components import from this module to get a ready-to-use GSAP instance with Draggable registered, plus helper functions that encode animation parameters (duration, easing, scale) without knowing about game logic.

## File Map

```
animation/
├── README.md
├── SPEC.md
├── register.ts           # GSAP plugin registration + re-exports
├── motion-tokens.ts      # shared GSAP timing, easing, and particle palette constants
├── drag-animations.ts    # direct drag lifecycle helpers
├── drag-animations.test.ts
├── snap-back-animations.ts # cross-owner snap-back registry and clone animation helpers
├── snap-back-animations.test.ts
├── tile-animations.ts    # compose pulse, configurable entrance, history reveal, particle burst
├── tile-animations.test.ts
└── tile-animations.test.tsx
```

## Types

- `TileSnapBackOptions` — caller hint for destination snap-back presentation.
- `TileSnapBackSnapshot` — captured clone, cleanup timer, and arrival-lift hint consumed by cross-owner snap-back.

Most functions accept `HTMLElement` targets and return a `gsap.core.Tween`; history reveal returns a `gsap.core.Timeline`, and particle burst returns a cleanup function.

## Functions

### motion-tokens.ts

Exports shared GSAP timing, easing, timeline positioning, snap-back tween options, and particle palette constants. The tokens keep animation helpers declarative: helpers describe which interaction is happening, while `motion-tokens.ts` owns the actual durations/easings. CSS-owned transitions use matching custom properties in `src/index.css` (`--motion-duration-fast`, `--motion-ease-standard`) so hover/lift and imperative feedback can be tuned together without hunting for literal durations.

#### Duration tokens

| Token                            |  Value | Current usage                                                                   | Purpose                                                                                  |
| -------------------------------- | -----: | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `MOTION_DURATION_INSTANT`        | `0.08` | `animateRotateSqueeze` squeeze/yoyo leg                                         | Near-immediate tactile feedback for reversible micro-interactions.                       |
| `MOTION_DURATION_FAST`           | `0.14` | `animateComposePulse` pulse/yoyo leg                                            | Quick emphasis for a successful compose without delaying input flow.                     |
| `MOTION_DURATION_PICK_UP`        | `0.15` | `animatePickUp` on drag start                                                   | Matches the feel of CSS hover/lift transitions while making a dragged tile feel grabbed. |
| `MOTION_DURATION_SLOT_ENTRANCE`  |  `0.2` | Filled submission slot entrance, history tile flip reveal                       | Short placement/reveal timing for tile-sized elements.                                   |
| `MOTION_DURATION_MEDIUM`         | `0.22` | Default `animateEntranceScale`, history row slide-in                            | Medium-weight UI reveal for newly rendered elements or rows.                             |
| `MOTION_DURATION_SNAP`           |  `0.3` | `SNAP_BACK_ANIMATION` in failed-drop reposition and cross-owner clone snap-back | Longer travel timing for visible repositioning across the board.                         |
| `MOTION_DURATION_PARTICLE_BURST` | `0.42` | Particle burst fade/flight                                                      | Lets celebration particles read after the tile action completes.                         |

#### Timeline tokens

| Token                         |      Value | Current usage                                     | Purpose                                                                          |
| ----------------------------- | ---------: | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `MOTION_STAGGER_HISTORY_TILE` |     `0.12` | `animateHistoryRowReveal` tile stagger            | Reveals submitted guess tiles left-to-right at a readable cadence.               |
| `MOTION_OVERLAP_HISTORY_TILE` | `"-=0.06"` | `animateHistoryRowReveal` tile animation position | Starts tile flips just before row slide-in finishes so the row feels continuous. |

#### Easing tokens

| Token                         | Value             | Current usage                         | Purpose                                                                |
| ----------------------------- | ----------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `MOTION_EASE_STANDARD_OUT`    | `"power2.out"`    | Pick-up, row slide-in, particle burst | Smooth default deceleration for motion that settles into place.        |
| `MOTION_EASE_STANDARD_IN`     | `"power2.in"`     | Rotate squeeze                        | Quick acceleration into a compressed state before yoyo recovery.       |
| `MOTION_EASE_DECISIVE_OUT`    | `"power3.out"`    | Compose pulse                         | More forceful game-action emphasis than the standard ease.             |
| `MOTION_EASE_DECISIVE_IN_OUT` | `"power3.inOut"`  | History tile flip reveal              | Balanced in/out easing for transform reveals.                          |
| `MOTION_EASE_SNAP`            | `"back.out(1.2)"` | Shared snap-back animation            | Small overshoot makes returns feel physical without bouncing too much. |
| `MOTION_EASE_ENTRANCE`        | `"back.out(1.7)"` | `animateEntranceScale`                | Larger overshoot helps newly appeared tiles read as pop-in feedback.   |

#### Palette token

| Token                   | Value                           | Current usage                                                        | Purpose                                                                              |
| ----------------------- | ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `PARTICLE_BURST_COLORS` | 오방색/단청-inspired hex colors | `animateParticleBurst` assigns colors round-robin to eight particles | Keeps celebration effects aligned with the visual theme and deterministic for tests. |

### animatePickUp(element) => gsap.core.Tween

Scales element to 1.08 over `MOTION_DURATION_PICK_UP` (0.15s). Called from GSAP Draggable's `onDragStart`. Does not clear transforms — Draggable manages position transforms during drag, and CSS owns tile shadows.

### animateReposition(element, onComplete?) => gsap.core.Tween

Animates element back to its origin using `SNAP_BACK_ANIMATION`, the single timing/ease definition shared by all snap-back motion. Used when a drop has no valid target or a compose is rejected.

### snap-back-animations.ts

Owns cross-owner tile snap-back orchestration. It is separate from direct drag helpers because it coordinates DOM clones, a tile-ID keyed snapshot registry, and entrance-suppression state across React owner changes.

### recordTileSnapBack / hasPendingTileSnapBack / popPendingTileSnapBack

Stores a dragged tile's release snapshot by stable tile ID before a reducer dispatch moves that tile between React owners. The snapshot includes a fixed-position DOM clone so the destination animation can remain visible while React swaps owners. Callers may mark user-directed drops with `shouldLiftOnArrival` so the clone and destination tile surface are already in the hover-lift pose during placement instead of waiting for hover CSS after the snap completes. The destination component consumes the snapshot after render so the animation runs exactly once. Consuming a snapshot also suppresses generic new-tile entrance feedback for that tile ID, because the clone is already providing the visible entrance.

### animateSnapBackFromRect(element, snapshot, onComplete?) => gsap.core.Tween

Hides the newly-rendered destination element, animates the captured clone into its natural layout position with `SNAP_BACK_ANIMATION`, then removes the clone and reveals the real element. If the snapshot requests arrival lift, the clone uses the destination tile's lift multiplier and both surfaces are pre-lifted without CSS transition before the snap begins, then the destination is handed back to CSS on the next frame. Used for submission-to-pool returns and submission-slot moves/swaps so they share the same visual language as failed-drop snap-back without pop/teleport artifacts.

### animateRotateSqueeze(element, onComplete?) => gsap.core.Tween

Plays the shared rotate feedback squeeze with `MOTION_DURATION_INSTANT` (0.08s), `MOTION_EASE_STANDARD_IN`, yoyo, and one repeat. `useTileFeedback` calls this helper so rotate, compose, and entrance feedback are all owned by the animation module.

### animateEntranceScale(element, onComplete?, options?) => gsap.core.Tween

Animates a newly rendered tile-like element from a configurable starting scale to its natural scale with `MOTION_EASE_ENTRANCE` (`back.out(1.7)`). Pool tiles use the default full pop-in from scale 0; filled submission slots use a milder scale 0.6 entrance so they feel placed into an existing compartment.

## Key Decisions

- Plugin registration runs once at module load time via top-level `gsap.registerPlugin(Draggable, useGSAP)` in `register.ts`. Components that need Draggable import from `register.ts` to guarantee registration order.
- `useGSAP` from `@gsap/react` wraps `useLayoutEffect` and creates a `gsap.Context` scoped to a container ref. All GSAP objects created inside the callback are auto-reverted on unmount. Animations created in event callbacks (Draggable's `onDragStart`, `onDragEnd`) must be wrapped with `contextSafe` to be tracked for cleanup.
- Animation helpers are thin wrappers over GSAP tweens — they encode timing and easing parameters but receive targets from callers. GSAP timings/easings come from `motion-tokens.ts`; all failed-drop and cross-owner snap-back tweens spread `SNAP_BACK_ANIMATION` so duration/ease stay defined in one place. No game logic awareness.
- Cross-owner snap-back lives in `snap-back-animations.ts` instead of `drag-animations.ts` because it is stateful animation coordination rather than direct drag feedback. Snapshot replacement and discard paths share one clone-removal helper so pending timers and detached clone nodes are cleaned up consistently.
- Cross-owner snap-back is keyed by stable tile ID, not component identity, because React unmounts/remounts or reuses slot DOM nodes when tiles move between submission slots and the pool.

---

## Open Questions

- Should `animateReposition` also scale back to 1, or does the caller handle that separately? Currently it handles both position and scale reset for simplicity.
