# Layout Specifications

This document defines the design specifications and layout rules for a responsive layout.

## Purpose

Binglebingle should support the same daily/shared puzzles for all players while remaining playable on the smallest supported mobile viewport. The layout must therefore scale around puzzle size.

The reference minimum viewport is:

```
375px × 667px
```

This is based on an iPhone SE-sized portrait viewport.

## Non-Negotiable Rules

1. **Minimum interactive target:** every interactive tile or slot must provide at least a `44px × 44px` hitbox.
2. **Navbar minimum height:** the navbar must reserve at least `44px`.
3. **History minimum height:** history must reserve at least `2.25` tile rows so a partial row can indicate scrollability.
4. **Pool must not scroll:** all currently available pool tiles must be visible at once.
5. **No physical submit button required:** submission may use a gesture to preserve vertical space.
6. **Pool tiles must rotate in place:** pool tiles need a square rotation-safe cell.
7. **Submission and history tiles do not rotate:** these areas may use portrait-only tile visuals.
8. **Tile visual ratio:** visible tiles remain `2:3` in portrait and `3:2` in landscape.

## Tile Bands

| Difficulty |  Word Length | Maximum Pool Tiles |
| ---------- | -----------: | -----------------: |
| X-Easy     | 3 characters |           18 tiles |
| Easy       | 4 characters |           24 tiles |
| Medium     | 5 characters |           30 tiles |
| Hard       | 6 characters |           36 tiles |
| X-Hard     | 7 characters |           42 tiles |

The maximum number of jamo any character can contain is 6. Therefor a 7-character puzzle should be able to support a maximum of 42 tiles.

## Core Layout Model

The layout is **hitbox-first**.

The square hitbox is the layout unit:

```
hitbox = interaction target = rotation-safe pool footprint
```

At the smallest tier:

```
hitbox = 44px × 44px
```

For a `44px` hitbox:

```
portrait tile ≈ 29px × 44px
landscape tile ≈ 44px × 29px
```

The interaction area remains `44px × 44px` even when the visible tile is narrower.

## The Five Layout Views

The design should be expressed as five layout views. These are not exact device breakpoints; they are design modes selected by available space and puzzle requirements.

| View    | Primary use                           | Tile cell feel       | Pool density              |
| ------- | ------------------------------------- | -------------------- | ------------------------- |
| x-small | Smallest phones, 7-character puzzles  | Minimum viable       | Highest density           |
| small   | Typical phones, 5–7-character puzzles | Slightly larger      | High density              |
| medium  | Large phones, portrait tablets        | Comfortable          | Medium density            |
| large   | Tablets and landscape devices         | Spacious             | Capped board width        |
| x-large | Desktop and wide screens              | Spacious, controlled | Centered/capped play area |

## x-small

For the smallest supported portrait viewport.

Reference constraints:

```
viewport: 375px × 667px
navbar: 44px
history: 2.25 tile rows minimum
submission: one tile row, gesture submit
pool: no scroll
```

Characteristics:

| Property               | Specification                   |
| ---------------------- | ------------------------------- |
| Tile cell              | `44px × 44px`                   |
| Tile gap               | Very small, approximately `4px` |
| Side padding           | Small, approximately `8px`      |
| Pool columns           | Usually `7`                     |
| Pool rows for 42 tiles | `6`                             |
| History height         | Minimum `2.25` rows             |

This view is the proof that 7-character puzzles can fit on the smallest target screen.

Flexible within this view:

- Pool may use fewer columns for smaller puzzle sizes if doing so improves balance.
- History may grow beyond `2.25` rows only if the full pool remains visible.
- Pool may be vertically centered in its remaining space if there is slack.

Must not flex in this view:

- Tile hitboxes must not drop below `44px × 44px`.
- The pool must not scroll.
- The navbar must not drop below `44px`.

## small

For modern phone portrait layouts where there is more width and/or height than the minimum target.

Characteristics:

| Property       | Specification                |
| -------------- | ---------------------------- |
| Tile cell      | Slightly larger than minimum |
| Tile gap       | Small to moderate            |
| Side padding   | Moderate                     |
| Pool columns   | `7` or `8`                   |
| History height | `2.25–3.25` rows             |

Flexible within this view:

- Tile cells may grow if 7-character / 42-tile pools still fit.
- Pool may move from `7` to `8` columns when it improves vertical balance.
- History may gain height before pool spacing becomes excessive.
- Side padding may increase before tile size increases if the layout feels cramped near screen edges.

## medium

For large portrait screens where the phone stack still works, but there is enough room to make the game feel less compressed.

Characteristics:

| Property       | Specification |
| -------------- | ------------- |
| Tile cell      | Comfortable   |
| Tile gap       | Moderate      |
| Side padding   | Comfortable   |
| Pool columns   | `8–10`        |
| History height | `3+`          |

Flexible within this view:

- Pool columns may increase to avoid overly tall pools.
- Pool width should not automatically fill the screen if that creates excessive spacing.
- History may grow significantly, especially when the pool needs fewer rows.
- Submission should remain visually tied to the pool rather than drifting too far away.

## large

For landscape or tablet layouts where a vertical phone stack may waste horizontal space.

Characteristics:

| Property       | Specification                      |
| -------------- | ---------------------------------- |
| Overall layout | Board-centered                     |
| History        | Taller vertical region             |
| Pool           | Capped to a comfortable play width |
| Pool columns   | Flexible, commonly `8–10`          |

Flexible within this view:

- History can take the full available vertical space up to the point where the pool would become clipped.
- Pool columns can increase, but should remain within a comfortable drag/play area.
- The board may be centered with unused margins rather than stretching to the viewport edges.

Must avoid:

- A pool that spans the full width of a wide landscape screen.
- Drag paths that require moving tiles across excessive distances.

## x-large

For wide screens where mobile stacking is no longer appropriate.

Characteristics:

| Property       | Specification                         |
| -------------- | ------------------------------------- |
| Overall layout | Centered game board                   |
| History        | Taller vertical region                |
| Pool           | Capped width, not full viewport width |
| Tile size      | Spacious but not oversized            |

Flexible within this view:

- History may become the dominant vertical element.
- Pool may use more columns if it remains within a comfortable board width.
- Extra viewport space should become margin or atmospheric background, not uncontrolled pool width.
- Tile size should stop growing once it feels like a comfortable game piece.

## Pool Column Rules

Pool column count is flexible within a view. It should be chosen to satisfy these priorities, in order:

1. Show all pool tiles without scrolling.
2. Preserve minimum `44px × 44px` hitboxes.
3. Keep the pool within a comfortable play width.
4. Avoid excessive vertical height.
5. Avoid excessive horizontal spread.

Typical pool column ranges:

| Context                    |                Expected columns |
| -------------------------- | ------------------------------: |
| Dense phone                |                             `7` |
| Comfortable phone          |                           `7–8` |
| Large phone / small tablet |                          `8–10` |
| Tablet / landscape         |   `8–10`, capped by board width |
| Desktop                    | Flexible, capped by board width |

For the top-end 42-tile pool:

| Columns | Rows needed |
| ------: | ----------: |
|       7 |      6 rows |
|       8 |      6 rows |
|       9 |      5 rows |
|      10 |      5 rows |

Increasing columns beyond 10 should be done cautiously because it can make the pool feel too wide and reduce tactile focus.

## History Rules

History should remain readable and should communicate that previous guesses are scrollable.

Minimum:

```
history height = 2.25 tile rows
```

Preferred behavior:

- On small phones, use the minimum height first.
- On larger phones, allow `2.5–3.25` rows.
- On tablets and desktop, history may take much more vertical space.
- History may scroll independently.

## Submission Rules

Submission is a single row matching the puzzle word length.

Rules:

- Submission tiles are portrait-only.
- Submission should remain close to the pool.
- Submission does not require a physical submit button.
- Submission may use gesture-based submission.
- Interactive submission slots should keep a minimum `44px × 44px` hitbox.
- Visible portrait tiles may be narrower than their hitboxes.

For 7-character puzzles at the smallest tier:

```txt
7 slots × 44px hitboxes + 6 small gaps fits within 375px width
```
