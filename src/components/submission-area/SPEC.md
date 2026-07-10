# SPEC: components/submission-area

**Status:** stable

## Purpose

Renders the submission row and submit button. Player places tiles into slots, sees resolved characters, and submits guesses.

**Boundaries:**

- Reads from: `useGame()` (state.submission)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/components/tile` for shared filled-slot character display, `src/components/button` for fixed-depth button structure and styling, `src/lib/engine/validate` for `canSubmit`

## File Map

```
submission-area/
├── SubmissionArea.tsx              # Container — maps slots + submit button
├── SubmissionArea.module.css       # Flex layout for slots row
├── SubmissionSlot.tsx              # Single slot — empty/filled rendering and slot animations
├── use-submission-slot-draggable.ts # Filled-slot GSAP Draggable mechanics
├── SubmissionSlot.module.css       # Slot styling (bordered motif empty/ghost placeholders, filled positioning)
├── lotus.svg                       # Editable ornament asset used inside the slot placeholder
├── SubmissionButton.tsx            # Validates and dispatches submit
├── SubmissionButton.module.css     # Submit button layout and ornaments for the shared Button
├── hills-2.svg                     # Editable right-side hills ornament asset used on the submit button
├── hills-3.svg                     # Editable left-side hills ornament asset used on the submit button
├── SubmissionArea.test.tsx
├── SubmissionSlot.test.tsx
├── SubmissionButton.test.tsx
├── README.md
└── SPEC.md
```

## Functions

### SubmissionArea

Reads `state.submission` from `useGame()` and renders a `SubmissionSlot` for each slot, plus a `SubmissionButton`. Passes semantic slot callbacks and submit dispatch down as props.

### SubmissionSlot

Renders a single slot. Empty slots show a thin bordered placeholder with a centered lotus motif from `lotus.svg`. Filled slots render `CharacterTile` for shared display and dispatch `SUBMISSION_SLOT_REMOVE` on tap.

Filled slots also act as drag sources through `useSubmissionSlotDraggable`: dragging a filled slot onto another slot records release positions, then dispatches `SUBMISSION_SLOT_MOVE`, swapping the two tiles (or moving into an empty slot) with snap-back motion into the destination slots. Dragging a filled slot outside all `data-slot-hitbox` elements in the `data-submission-slots` row records the release position, then dispatches `SUBMISSION_SLOT_REMOVE`, returning it to the pool without requiring a precise pool drop; the pool tile animates from the release point into its pool layout position. Tapping a filled slot records the slot's resting position before removal so click-to-return uses the same snap-back path. A 4px movement threshold distinguishes tap from drag, matching Tile's behavior. Drop targets are identified by `data-slot-index`; the slot never drops onto itself.

Submission slots use the visible portrait tile width (`--tile-visual-short-edge`) rather than the square pool hitbox width because submission tiles do not rotate. Their height remains `--tile-hitbox-size`, preserving the minimum vertical interaction size. The row uses `--tile-submission-history-gap` so submission and history visual spacing can stay consistent while remaining independent from the pool's rotation-safe `--tile-gap` cadence. Filled slot ghosts keep the placeholder persistently rendered behind the tile instead of toggling visibility or depth on hover. At rest, the tile surface covers the placeholder; when the tile surface lifts, the already-present placeholder and its depth are revealed with no separate pop or movement.

### SubmissionButton

Calls `canSubmit(submission)` to determine validity. Disabled when invalid; dispatches `ROUND_SUBMISSION_SUBMIT` on click when valid. The visual surface uses a cream face with a rounded border, hills-3 on the left, hills-2 on the right, and tile-like faux depth. Hover/focus lifts the surface from the stable button hit area, while press translates the surface down and right with the transparent cast shadow removed.

## Key Decisions

**Callbacks over dispatch in SubmissionSlot.** Mirrors the Tile/Pool boundary — SubmissionSlot delegates pointer/drag mechanics to `useSubmissionSlotDraggable` and surfaces semantic callbacks (`onTap`, `onDropOnSlot`, `onDropOnPool`); SubmissionArea translates those into dispatch calls. Keeps SubmissionSlot testable with plain function spies and free of game-action knowledge.

**Cross-owner moves use captured release rects.** When a filled slot is dropped onto another slot, tapped, or dragged back to the pool, the hook records the source tile's screen rect before dispatch. Slot swaps also record the displaced target tile's rect. User-directed slot drops mark the arriving source tile for an immediate hover-lift pose so placement and lift feel like one response rather than two sequential effects. Destination components consume those rects by tile ID and animate from the release/old position into the new layout position, avoiding the previous disappear/reappear effect. Drag-completed clicks are ignored so a swap does not immediately trigger the source slot's tap-to-remove behavior.

**canSubmit gates the button, not placement.** Incomplete characters can be placed in slots per the game spec; validation only happens at submit time.

**Use a CSS border with an inline SVG motif placeholder.** The placeholder imports `lotus.svg` as an SVG component so vector tools can edit it directly. Drop-target emphasis preserves the normal border and motif treatment, changing only the placeholder background to a muted green so the SVG does not saturate or desaturate during drag feedback. The placeholder uses the same bottom-right depth distance as tiles, but only with the solid depth color; the transparent cast shadow is intentionally omitted because an empty slot is resting in place rather than hovering.

**Keep SubmissionButton depth on an inner surface.** Like `BaseTile`, the shared `Button` keeps the outer native button as the stable pointer target and moves the visual surface for hover/focus/press feedback. `Button` owns the fixed shadow stack, lifted/pressed translations, and layered text treatment used by both nav actions and the submission button. The hills motifs live beside the component as editable SVGs and use `currentColor` so both ornaments stay synchronized with the button stroke color.

**Use tile text treatment for the SubmissionButton label.** The label reuses a tile-like conic najeon gradient with separate backing layers for a 1px black stroke and subtle stroked text depth. The depth is a single duplicated label translated 1px along the Y axis because `text-shadow` with transparent, background-clipped Hangul glyphs can produce distracting artifacts inside the visible gradient fill.
