# 빙글빙글 — Design Language

A reference document for the visual identity of 빙글빙글. Use this as context
when generating UI in any tool — v0, Claude artifacts, Figma, or as input to
GSD's UI phase.

---

## Aesthetic Reference

The visual language is rooted in Korean dancheong (단청) — the polychromatic
decorative paintwork applied to traditional wooden architecture. The specific
qualities to carry into the UI:

- **Colour contained by outline.** Every colour field is bounded by a strong dark
  border. Colour never bleeds between compartments.
- **Geometric precision.** Patterns are mathematical and structured — interlaced
  knot medallions, diagonal grids, repeating tile units. Nothing is loose or
  organic except the floral accent elements.
- **Flower rosettes as punctuation.** Small stylised flower motifs appear at grid
  intersections and structural joints — not decoration for its own sake, but as
  a visual full stop at the meeting point of two elements.
- **Stripe banding on structural elements.** Borders, dividers, and frames use
  multi-colour stripe sequences rather than a single colour. The order follows
  the obangsaek palette.
- **Dense richness without muddiness.** The palette is maximalist but disciplined
  — each colour occupies a defined role and zone. The result feels ceremonial
  and handcrafted, not garish.

---

## Colour Palette

Extracted from reference photography. Use these values precisely.

| Role       | Name          | Hex       | Usage                               |
| ---------- | ------------- | --------- | ----------------------------------- |
| Background | Vermillion    | `#C8391A` | Primary surface — warm red-orange   |
| Structure  | Forest green  | `#2A6B3A` | Frames, borders, tile backs         |
| Accent     | Navy          | `#1C2D7A` | Secondary frames, contrast elements |
| Highlight  | Golden yellow | `#D4920A` | Accent fills, active states         |
| Light      | Cream         | `#F0E2B4` | Text on dark, light fills           |
| Outline    | Near-black    | `#1A120A` | All outlines and dividers           |
| Correct    | Deep red      | `#A82010` | Correct position result tile        |
| Present    | Amber         | `#C87808` | Present but wrong position tile     |
| Absent     | Slate         | `#3A3A4A` | Absent tile                         |

The **vermillion background** is the dominant surface — not dark, not neutral.
The UI should feel warm and rich, like looking up at a temple ceiling.

---

## Typography

- **Game characters (jamo/syllables on tiles):** A bold serif hangul typeface.
  Noto Serif KR Bold or a calligraphic hangul display font. Characters should
  feel weighty and crafted, not thin or technical.
- **UI labels and navigation:** A clean geometric sans-serif — Noto Sans KR
  Medium or similar. High contrast against the warm background.
- **Game name 빙글빙글:** Display size, bold serif hangul, cream on vermillion.

---

## Component Philosophy

### Tiles (토큰)

The core interactive element. Every interaction in the game is mediated through
tiles. They must feel **physical and collectible** — like a hwatu (화투) playing
card or a carved game piece, not a UI button.

- Portrait-proportioned rectangle, roughly 2:3 ratio
- Slightly rounded corners (4–6px equivalent)
- **Face:** Dark background (near-black or deep navy), large jamo character
  centred in cream/white, dancheong border frame inset inside the outline
- **Border frame:** A thin stripe sequence in obangsaek colours — the same
  multi-colour banding seen on dancheong structural elements
- **Outline:** 2px near-black border
- **Drop shadow:** Subtle, warm-toned — suggests physical thickness

Tile states:

- **Default (pool):** Near-black face, cream character, coloured border frame
- **Selected/active:** Golden yellow accent glow or border brightening
- **Correct:** Deep red face fill, cream character
- **Present:** Amber face fill, near-black character
- **Absent:** Slate face fill, muted character

### Submission Slots

Empty slots waiting to receive tiles. Should read as **inset compartments** —
like the empty panels in a dancheong grid waiting to be filled.

- Same proportions as tiles
- Outline only, no fill — or a very faint vermillion darkening
- Interior shows a faint geometric placeholder motif (optional — single knot
  outline or simple diamond)

### Guess History Board

Rows of evaluated tiles. Each row is a complete guess, left to right.

- Rows separated by thin cream divider lines
- Empty future rows shown as faint slot outlines
- The board as a whole should read like a decorated panel — the stripe banding
  between rows reinforces the dancheong grid quality

### Navigation Bar

- Vermillion background, cream text and icons
- Game name 빙글빙글 left-aligned in display typeface
- Right side: two icon buttons (instructions, settings) — simple geometric icons,
  cream fill
- Bottom edge: a thin multi-colour stripe band (obangsaek sequence) as a divider
  — this is the dancheong banding motif applied to a UI divider

### Controls Bar

- Two buttons: Reset (secondary) and Submit (primary)
- Submit uses deep red background with cream text when enabled;
  slate/muted when disabled
- Reset uses forest green background with cream text
- Both buttons have the characteristic outline + slight border frame treatment
- Separated by a dancheong-style stripe divider from the pool area above

---

## Motif Library (for decorative use)

These motifs appear in the reference photography and can be used sparingly as
texture, background pattern, or decorative accents. Do not overuse — they are
punctuation, not wallpaper.

- **수(壽) knot medallion:** The interlaced square-within-circle geometric motif.
  Appears on tile backs, loading states, or empty board backgrounds.
- **Flower rosette:** Simple stylised five-petal flower in golden yellow with a
  small circle centre. Appears at corners of frames or as success/correct
  indicators.
- **Stripe band:** Repeating thin stripes in vermillion → green → navy → yellow
  → cream sequence. Used as dividers and border insets.
- **Diagonal grid:** The overall lattice structure of the ceiling panel — useful
  as a subtle background texture at low opacity.

---

## Mood and Feel

**Ceremonial.** The game should feel like it has weight and occasion, not like a
casual mobile time-killer. The visual richness signals that something meaningful
is happening.

**Tactile.** Tiles should look like things you want to pick up and place. The
physical quality of the dancheong paintwork — visible brush, contained colour,
structured geometry — should translate into components that feel made rather than
rendered.

**Distinctly Korean.** Not generically "Asian." The specific references —
dancheong geometry, obangsaek palette, hwatu card proportions, the 수 knot — are
rooted in a specific tradition. The design should be legible to someone who knows
that tradition and intriguing to someone who doesn't.

---

## What to Avoid

- Dark/black backgrounds — the reference palette is warm vermillion, not dark
- Pastel or muted interpretations of obangsaek — these colours are saturated
- Thin or lightweight typography — everything should have visual weight
- Flat modern UI components (pill buttons, floating action buttons, bottom sheets)
  — the interaction model is tile-based, not standard mobile UI
- Generic "Korean" aesthetics (hanbok gradients, generic lotus patterns) — stay
  grounded in the specific dancheong and hwatu references
