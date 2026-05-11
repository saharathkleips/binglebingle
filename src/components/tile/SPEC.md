# SPEC: components/tile

**Status:** stable

## Purpose

Provides reusable tile presentation for Binglebingle without coupling visual identity to any single game surface. Data flows from consuming components into a small visual primitive as already-renderable content, or into a character wrapper as a `Character` that is resolved for display.

**Boundaries:**

- Reads from: component props only.
- Dispatches to: nothing.
- Calls into: `src/lib/character` only from `CharacterTile` for display resolution; `src/lib/animation` only from `useTileFeedback`.
- Does not call into: game context, reducers, pool logic, submission logic, or history logic.
- `BaseTile` does not call into: GSAP, character resolution, game context, reducers, pool logic, submission logic, or history logic.

The module is intentionally not an interaction layer. Drag/drop, tap, hit testing, reducer dispatches, invalid-drop recovery, submission readiness, history result semantics, and instruction-specific layout remain owned by their feature modules.

## File Map

```txt
tile/
├── BaseTile.tsx             # Shared visual primitive; no game state, no GSAP, no character resolution
├── BaseTile.module.css      # Shared tile visual identity and narrow visual variants
├── BaseTile.test.tsx
├── lightning-border.svg     # Editable 번개문 border asset imported through SVGR
├── CharacterTile.tsx        # Resolves a game Character and renders BaseTile
├── CharacterTile.test.tsx
├── use-tile-feedback.ts     # Shared GSAP feedback hook for behavior components
├── README.md
└── SPEC.md
```

## Public API

- `BaseTile` renders shared tile visuals for already-renderable content.
- `BaseTileProps` configures `BaseTile` with visual props, pass-through DOM hooks, and caller-owned class names.
- `BaseTileElement` is `"button" | "div" | "span"`.
- `BaseTileSize` is `"standard" | "compact"`.
- `BaseTileTone` is `"default" | "correct" | "present" | "absent"`.
- `CharacterTile` resolves a game `Character` and renders the result in `BaseTile`.
- `CharacterTileProps` is `Omit<BaseTileProps, "children"> & { character: Character }`.
- `useTileFeedback` plays shared GSAP feedback animations on a caller-owned element ref.
- `UseTileFeedbackOptions` supplies the element ref, feedback flags, and completion callbacks.

## Types

```ts
type BaseTileProps = {
  children: React.ReactNode;
  className?: string;
  dataAttributes?: Record<`data-${string}`, string | number | boolean>;
  element?: BaseTileElement;
  isDisabled?: boolean;
  isHighlighted?: boolean;
  isInteractive?: boolean;
  label?: string;
  onAnimationEnd?: React.AnimationEventHandler<HTMLElement>;
  size?: BaseTileSize;
  testId?: string;
  tileRef?: React.Ref<HTMLElement>;
  tone?: BaseTileTone;
};

type CharacterTileProps = Omit<BaseTileProps, "children"> & {
  character: Character;
};

type UseTileFeedbackOptions = {
  elementRef: React.RefObject<HTMLElement | null>;
  isRotating?: boolean;
  isJustComposed?: boolean;
  isNewlyAdded?: boolean;
  onRotatingEnd?: () => void;
  onComposedEnd?: () => void;
  onNewlyAddedEnd?: () => void;
};
```

Add a new prop only when at least one current consumer needs that visual state.

## Tile Sizing Model

The shared tile foundation is hitbox-first. `src/index.css` owns global tokens because pool, submission, history, instructions, and tile visuals all need the same geometry without depending on a CSS Module from this package.

The square layout unit is `--tile-hitbox-size`. The x-small tier sets it to `44px`, matching the minimum interactive target from `docs/design/layout.md`. The visible portrait tile keeps the physical card ratio inside that cell:

```txt
width:  var(--tile-visual-short-edge) = hitbox × 2 / 3
height: var(--tile-visual-long-edge)  = hitbox
```

The five supported viewport tiers are `x-small`, `small`, `medium`, `large`, and `x-large`. The `x-small` tier is defined as the default token set without a media query so the game can render on narrow-but-tall or otherwise unusual screens. CSS media queries select larger tiers without JavaScript or root data attributes. Each tier hand-tunes `--tile-gap`, `--tile-submission-history-gap`, `--pool-min-visible-rows`, `--tile-radius`, `--tile-border-padding`, `--tile-font-size`, `--tile-shadow-step`, `--tile-shadow-depth`, and `--tile-glow-size`; these values intentionally are not one fully-fluid formula because the dense tiers need simplified detail. `x-large` is capped at a spacious game-piece size rather than growing indefinitely. `--history-min-visible-rows` is a default minimum rather than a cap; history can grow into extra vertical space after the pool's expected footprint is preserved.

`BaseTile` is the visible card only. Consuming regions own square cells/hitboxes when they need them: pool cells can later rotate landscape tiles inside the square hitbox, while submission and history can remain portrait-only.

## Components

### BaseTile

Renders tile content with the shared tile surface: dimensions, 번개문 lightning-pattern border, face, shadow, typography, and visual-only variants. It may render as a different element when semantics require it, but it must not own behavior for that element beyond passing safe DOM props needed for presentation and accessibility.

Rules:

- Accept already-renderable display content via `children`.
- Do not import GSAP, `useGame`, reducer action types, pool/submission/history components, `resolveCharacter`, or character composition/rotation helpers.
- Do not know about tile IDs, slot indices, drag targets, submitted guesses, or evaluation logic; it only passes caller-owned `data-*` attributes through to the rendered element.
- Do not dispatch actions or register global event listeners.
- Keep variant names visual and reusable across modules.

### CharacterTile

Accepts a game `Character`, calls `resolveCharacter`, and renders `BaseTile` with the resolved display text.

Rules:

- Contains no interaction, animation, reducer, or context behavior.
- Passes only visual props through to `BaseTile`.
- Remains the only shared tile component responsible for character resolution.

### useTileFeedback

Small hook that plays tile feedback animations on a caller-owned element ref: rotate squeeze, compose pulse with particle burst, and entrance scale.

Rules:

- Keep GSAP setup outside `BaseTile` and `CharacterTile`.
- Accept only visual feedback flags, completion callbacks, and the element ref to animate.
- Do not read game context, dispatch actions, or know about pool/submission/history semantics.
- Do not introduce a generic `AnimatedTile` layer unless consumers need the exact same contract.

## Key Decisions

**Character resolution is separate from base visuals.** `BaseTile` receives display content and therefore stays reusable for history result markers, instruction examples, empty/future visual states, and any non-character tile-like content. `CharacterTile` is the convenience wrapper for game characters.

**Feature modules own semantics.** Pool tiles can be draggable and tappable, submission slots can swap or return tiles, history tiles can show evaluation tones, and instructions can render examples. Those behaviors are outside this module even when they share the same visual surface.

**DOM hooks are pass-through only.** `tileRef`, `dataAttributes`, `testId`, and `onAnimationEnd` exist so feature modules can attach their own semantics to the same visual element. `BaseTile` must not interpret those attributes or callbacks.

**Feedback animations are hook-based.** `useTileFeedback` centralizes the shared GSAP feedback setup without making visual components depend on GSAP or creating a generic animated component layer.

**Use visual names, not source-context names.** Shared props describe appearance (`tone="correct"`, `isHighlighted`) rather than the module that caused it (`isHistoryCorrect`, `isDropTarget`). This keeps the primitive redesignable without importing feature concepts.

**Import the tile border through SVGR.** The 번개문 path remains in `lightning-border.svg` so vector tools can edit it directly, while `BaseTile` imports it as an inline React SVG with `?react`. `BaseTile` owns per-instance gradient definitions because repeated SVG paint-server IDs collide in the document. Component-local CSS custom properties describe the SVG gradient stop slots, and their values reference root palette tokens where possible.

**Keep reusable tile tokens in `:root`.** Hitbox size, visible tile edges, compact scale, pool gap, submission/history gap, radius, border padding, font size, glow size, and shadow depth live in `src/index.css` because pool, submission, history, instructions, and tile visuals need the same geometry and effects. Older `--size-tile-*` and `--font-size-tile` aliases are intentionally not kept; this project is still small enough to migrate consumers directly to the hitbox-first tokens. `BaseTile.module.css` keeps only local state variables such as the currently selected visible edges and SVG gradient stop slots.

**BaseTile is not the hitbox.** The visual card derives from `--tile-visual-short-edge` and `--tile-visual-long-edge`; square `--tile-hitbox-size` wrappers belong to consuming regions that need interaction cells or rotation-safe pool footprints.
