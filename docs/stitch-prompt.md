# 빙글빙글 — Stitch Design Prompts

## Approach

Build the design iteratively — one prompt per step. Do not move to the next prompt
until the current output looks right. One change at a time.

Start in **mobile portrait**, standard phone dimensions.

---

## Prompt 1 — Visual Language and Skeleton

A simple mobile game called 빙글빙글. Establish the visual style only — no game
logic, no complex components.

**Visual direction:**
Inspired by Korean dancheong (단청) — traditional temple decorative paintwork.
Bold geometric shapes, strong outlines, flat areas of saturated colour. Dark
near-black background. Colour palette follows obangsaek (오방색): deep blue-green,
vermillion red, golden yellow, white, near-black. Saturated and intentional —
never pastel or muted.

**Layout — three zones stacked vertically:**
1. A narrow navigation bar at the top with the game name 빙글빙글 on the left and
   two icon buttons on the right.
2. A large open content area in the middle — leave this empty for now.
3. A narrow controls bar at the bottom with two buttons side by side.

**Mood:** Ceremonial, graphic, bold. Like a traditional Korean aesthetic applied
to a modern mobile screen.

---

## Prompt 2 — Token Tile Style

Design a single game tile (token). This is the core interactive element — a
draggable card the player picks up and moves.

The tile should look like a Korean hwatu (화투) playing card: small, slightly
portrait-proportioned, thick, bold flat graphic on a deep background. Slightly
rounded corners. The Korean character ㄱ displayed large and centred on the face.
Card face uses the obangsaek palette. Bold, slightly calligraphic hangul typeface
for the character.

Show the tile at the size it would appear in the game — small enough that 6–8
tiles fit comfortably in the lower half of a phone screen.

---

## Prompt 3 — Pool Area

Populate the middle content area with a loose arrangement of 8 token tiles showing
different Korean jamo characters: ㄱ ㄴ ㅎ ㅏ ㅣ ㅗ ㅜ ㅇ

Tiles sit on the dark background like cards spread on a table. No grid — organic
but readable arrangement. These are the pieces the player picks up and uses.

---

## Prompt 4 — Submission Row

Above the pool area, add a row of 3 evenly spaced empty slot placeholders. These
are where the player places completed tiles to form their guess. Slots are the
same size as the tiles, outlined with a muted border, empty inside. There should
be clear visual separation between the submission row and the pool area below it.

---

## Prompt 5 — Guess History Board

Above the submission row, add a guess history board. It shows previous guesses as
rows of 3 filled tiles. Show 2 completed example rows and 3 empty placeholder rows
below them.

Completed tiles use three colours from the obangsaek palette:
- Vermillion red background: character is in the correct position
- Golden yellow background: character is in the word but wrong position
- Dark charcoal background: character is not in the word

Empty rows are faint outlined placeholders matching the submission slot style.

---

## Prompt 6 — Refine and Tighten

Review the full layout. Make the following adjustments:
- Ensure the three zones (board, submission row, pool) have clear visual hierarchy
  and breathing room between them
- The pool area should feel like the play space — slightly more visual weight than
  the other zones
- Controls bar at the bottom: left button is Reset (secondary style), right button
  is Submit (primary style, using the vermillion red accent)
- Submit button should appear in a disabled/muted state for now

---

## Fallback — If Tiles Look Too Generic

If the token tiles look like standard app UI cards rather than hwatu-inspired game
pieces, use this follow-up:

The game tiles should feel more physical and playful — like traditional Korean
hwatu (화투) playing cards. Bold flat character on a rich dark background, strong
graphic presence, slightly portrait shape. Less like a UI component, more like a
game piece you want to pick up.
