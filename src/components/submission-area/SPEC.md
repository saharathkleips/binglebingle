# SPEC: components/submission-area

**Status:** stable

## Purpose

Renders the submission row and submit button. Player places tiles into slots, sees resolved characters, and submits guesses.

**Boundaries:**

- Reads from: `useGame()` (state.submission)
- Dispatches to: `useGame()` (dispatch)
- Calls into: `src/components/tile` for shared filled-slot character display, `src/lib/engine/validate` for `canSubmit`

## File Map

```
submission-area/
├── SubmissionArea.tsx              # Container — maps slots + submit button
├── SubmissionArea.module.css       # Flex layout for slots row
├── SubmissionSlot.tsx              # Single slot — empty/filled rendering and slot animations
├── use-submission-slot-draggable.ts # Filled-slot GSAP Draggable mechanics
├── SubmissionSlot.module.css       # Slot styling (bordered motif empty/ghost placeholders, filled positioning)
├── dancheong.svg                   # Editable ornament asset used inside the slot placeholder
├── SubmissionButton.tsx            # Validates and dispatches submit
├── SubmissionButton.module.css     # Neo-brutalist submit button surface, borders, depth, and interaction states
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

Reads `state.submission` from `useGame()` and renders a `SubmissionSlot` for each slot, plus a `SubmissionButton`. Passes `dispatch` down as props.

### SubmissionSlot

Renders a single slot. Empty slots show a thin bordered placeholder with a centered dancheong motif from `dancheong.svg`. Filled slots render `CharacterTile` for shared display and dispatch `SUBMISSION_SLOT_REMOVE` on tap.

Filled slots also act as drag sources through `useSubmissionSlotDraggable`: dragging a filled slot onto another slot dispatches `SUBMISSION_SLOT_MOVE`, swapping the two tiles (or moving into an empty slot). Dragging a filled slot outside all `data-slot-hitbox` elements in the `data-submission-slots` row dispatches `SUBMISSION_SLOT_REMOVE`, returning it to the pool without requiring a precise pool drop. A 4px movement threshold distinguishes tap from drag, matching Tile's behavior. Drop targets are identified by `data-slot-index`; the slot never drops onto itself.

Submission slots use the visible portrait tile width (`--tile-visual-short-edge`) rather than the square pool hitbox width because submission tiles do not rotate. Their height remains `--tile-hitbox-size`, preserving the minimum vertical interaction size. The row uses `--tile-submission-history-gap` so submission and history visual spacing can stay consistent while remaining independent from the pool's rotation-safe `--tile-gap` cadence. Filled slot ghosts keep the placeholder available behind the tile for drag-away orientation, but hide the placeholder while the filled tile is resting in the slot so its border and depth cannot visually merge with the tile's own lifted shadow stack on hover. The placeholder reappears during drag/drop feedback, and its depth returns only while dragging, when the placeholder is exposed as the original slot position.

### SubmissionButton

Calls `canSubmit(submission)` to determine validity. Disabled when invalid; dispatches `ROUND_SUBMISSION_SUBMIT` on click when valid. The visual surface uses a cream face with a rounded border, hills-3 on the left, hills-2 on the right, and tile-like faux depth. Hover/focus lifts the surface from the stable button hit area, while press translates the surface down and right with the transparent cast shadow removed.

## Key Decisions

**Callbacks over dispatch in SubmissionSlot.** Mirrors the Tile/Pool boundary — SubmissionSlot delegates pointer/drag mechanics to `useSubmissionSlotDraggable` and surfaces semantic callbacks (`onTap`, `onDropOnSlot`, `onDropOnPool`); SubmissionArea translates those into dispatch calls. Keeps SubmissionSlot testable with plain function spies and free of game-action knowledge.

**canSubmit gates the button, not placement.** Incomplete characters can be placed in slots per the game spec; validation only happens at submit time.

**Use a CSS border with an inline SVG motif placeholder.** The placeholder imports `dancheong.svg` as an SVG component so vector tools can edit it directly. Drop-target emphasis preserves the normal border and motif treatment, changing only the placeholder background to a muted green so the SVG does not saturate or desaturate during drag feedback. The placeholder uses the same bottom-right depth distance as tiles, but only with the solid depth color; the transparent cast shadow is intentionally omitted because an empty slot is resting in place rather than hovering.

**Keep SubmissionButton depth on an inner surface.** Like `BaseTile`, the button keeps the outer native button as the stable pointer target and moves the visual surface for hover/focus/press feedback. This avoids hover jitter while giving the cream bordered face a fixed system shadow stack, lifted shadow stack, and hover translation distance that do not scale with responsive game tiles. The hills motifs live beside the component as editable SVGs and use `currentColor` so both ornaments stay synchronized with the button stroke color.

**Use tile text treatment for the SubmissionButton label.** The label reuses a tile-like conic najeon gradient with separate backing layers for a 1px black stroke and subtle stroked text depth. The depth is a single duplicated label translated 1px along the Y axis because `text-shadow` with transparent, background-clipped Hangul glyphs can produce distracting artifacts inside the visible gradient fill.
