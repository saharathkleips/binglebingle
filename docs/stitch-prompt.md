# 빙글빙글 — Stitch Design Prompt

## How to Use This File

Start with the **Initial Prompt** below to establish the visual language. After the first generation, use the **Follow-up Prompts** one at a time — one change per prompt. Do not combine multiple changes in a single prompt or Stitch will regenerate the full layout and lose prior decisions.

Start in **mobile portrait orientation**. Do not use web layout.

---

## Initial Prompt — Main Game Screen

A mobile word game app called 빙글빙글. Design the main game screen.

**Visual direction:**
Inspired by Korean dancheong (단청) — traditional temple decorative paintwork. Bold geometric compartmentalisation, strong outlines containing flat colour. Colour palette strictly follows obangsaek (오방색): deep blue-green (청), vermillion red (적), golden yellow (황), white (백), and near-black (흑). Saturated, intentional, never pastel. Dark background (흑).

**Tile/token style:**
Inspired by Korean hwatu (화투) playing cards — small, thick, portrait-format cards with bold flat graphic illustration on a deep background. Strong silhouette, minimal detail, very graphic. Each token tile should feel like a collectible card: slightly rounded corners, a dancheong-patterned card back texture. The jamo character (Korean letter) is displayed large and centred on the tile face.

**Screen layout (top to bottom):**
1. Navigation bar — game name 빙글빙글 on the left, instructions icon and settings icon on the right
2. Guess history board — a grid of rows showing past guesses. Each row contains 3 tile-sized cells. Cells are coloured: vermillion red for correct position, golden yellow for present but wrong position, dark grey for absent. Empty rows show as faint outlined placeholders.
3. Submission row — a fixed row of 3 empty slot placeholders where the player drags completed tiles to form their guess. Slots are outlined, same size as tiles.
4. Pool area — a loose arrangement of draggable jamo token tiles. Show approximately 8 tiles of varying Korean consonants and vowels (e.g. ㄱ, ㄴ, ㅎ, ㅏ, ㅣ, ㅗ, ㅜ, ㅇ). Tiles sit on the dark background like cards on a table.
5. Controls — a Submit button (disabled state, muted) and a Reset button, side by side at the bottom.

**Typography:**
Korean characters on tiles should use a bold, slightly calligraphic serif hangul typeface. UI labels in a clean geometric sans-serif.

**Mood:** Ceremonial, tactile, bold. Like playing a traditional Korean game with beautifully crafted pieces.

---

## Follow-up Prompts

Use these one at a time after the initial generation. Do not combine.

**1. Token tile states**
Show the jamo token tile in four states side by side: a single basic consonant (ㄱ), a combined vowel (ㅐ), a partial character without jongseong (가), and a complete character with jongseong (한). All four should share the same tile style established in the main screen.

**2. Correct/present/absent tile colours**
Refine the guess history tile colours. Correct position: vermillion red (적) background with white character. Present but wrong position: golden yellow (황) background with near-black character. Absent: dark charcoal background with muted character. Empty placeholder: faint outlined tile, no fill.

**3. Instructions screen**
Design an instructions screen with the same visual language. Show three sections with example tiles: how rotation works (ㄱ rotating to ㄴ), how combination works (ㅏ + ㅣ combining into ㅐ), and how tile results are read (correct / present / absent). Include a large "Play" button at the bottom to dismiss the screen.

**4. Win state**
On the main game screen, replace the pool area with a win state panel. Show the target word in large completed tiles, the number of guesses taken, and a Share button (inactive placeholder). The guess history board above remains fully visible. Retain all dancheong and obangsaek styling.

---

## Fallback Prompt

If Stitch generates tiles that look too generic, use this follow-up:

Make the jamo token tiles feel more like hwatu (화투) playing cards — bold flat illustration, deep background, thick card-like appearance, slightly portrait proportioned, strong graphic character.
