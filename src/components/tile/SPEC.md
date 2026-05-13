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
├── lightning-border.svg     # Editable 번개문 border asset used as the CSS mask
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
- `CharacterTile` resolves a game `Character` and renders the result in `BaseTile`.
- `CharacterTileProps` is `Omit<BaseTileProps, "children"> & { character: Character }`.
- `useTileFeedback` plays shared GSAP feedback animations on a caller-owned element ref.
- `UseTileFeedbackOptions` supplies the element ref, feedback flags, and completion callbacks.

## Types

```ts
type BaseTileSharedProps = {
  children: React.ReactNode;
  className?: string;
  dataAttributes?: Record<`data-${string}`, string | number | boolean>;
  isInteractive?: boolean;
  label?: string;
  onAnimationEnd?: React.AnimationEventHandler<HTMLElement>;
  result?: CharacterResult;
  testId?: string;
};

type BaseTileProps =
  | (BaseTileSharedProps & { element?: "div"; ref?: React.Ref<HTMLDivElement> })
  | (BaseTileSharedProps & { element: "button"; ref?: React.Ref<HTMLButtonElement> })
  | (BaseTileSharedProps & { element: "span"; ref?: React.Ref<HTMLSpanElement> });

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

Add a new prop only when at least one current consumer needs that visual state. `BaseTile` intentionally does not expose a disabled state until a tile consumer needs the native disabled semantics; current tiles are either interactive or inert.

## Tile Sizing Model

The shared tile foundation is hitbox-first. `src/index.css` owns global tokens because pool, submission, history, instructions, and tile visuals all need the same geometry without depending on a CSS Module from this package.

The square layout unit is `--tile-hitbox-size`. The x-small tier sets it to `44px`, matching the minimum interactive target from `docs/design/layout.md`. The visible portrait tile keeps the physical card ratio inside that cell:

```txt
width:  var(--tile-visual-short-edge) = hitbox × 2 / 3
height: var(--tile-visual-long-edge)  = hitbox
```

The five supported viewport tiers are `x-small`, `small`, `medium`, `large`, and `x-large`. The `x-small` tier is defined as the default token set without a media query so the game can render on narrow-but-tall or otherwise unusual screens. CSS media queries select larger tiers without JavaScript or root data attributes. Each tier hand-tunes `--tile-gap`, `--tile-submission-history-gap`, `--pool-min-visible-rows`, `--tile-radius`, `--tile-border-padding`, `--tile-font-size`, `--tile-shadow-step`, and `--tile-shadow-depth`; these values intentionally are not one fully-fluid formula because the dense tiers need simplified detail. `x-large` is capped at a spacious game-piece size rather than growing indefinitely. `--history-min-visible-rows` is a default minimum rather than a cap; history can grow into extra vertical space after the pool's expected footprint is preserved.

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

**Feature modules own semantics.** Pool tiles can be draggable and tappable, submission slots can swap or return tiles, history tiles can show evaluation results, and instructions can render examples. Those behaviors are outside this module even when they share the same visual surface.

**DOM hooks are pass-through only.** `ref`, `dataAttributes`, `testId`, and `onAnimationEnd` exist so feature modules can attach their own semantics to the same visual element. `BaseTile` must not interpret those attributes or callbacks.

**Feedback animations are hook-based.** `useTileFeedback` centralizes the shared GSAP feedback setup without making visual components depend on GSAP or creating a generic animated component layer.

**Use engine result names for evaluated tiles.** `BaseTile` accepts an optional `result?: CharacterResult` instead of duplicating evaluation values as visual tone strings. Leaving `result` undefined selects the default tile treatment, while `CORRECT`, `PRESENT`, and `ABSENT` apply evaluated tile gradients.

**Use the tile border as a CSS mask.** The 번개문 path remains in `lightning-border.svg` so vector tools can edit it directly, while `BaseTile` imports it as a URL and applies it as the mask for a CSS linear gradient. Masking keeps the editable SVG shape while allowing the border gradient to be configured in CSS alongside the tile variants. Component-local CSS custom properties describe the result gradient stop slots used by both the border and text, and their values reference root palette tokens where possible.

**Keep reusable tile tokens in `:root`.** Hitbox size, visible tile edges, pool gap, submission/history gap, radius, border padding, font size, and shadow depth live in `src/index.css` because pool, submission, history, instructions, and tile visuals need the same geometry and effects. Older `--size-tile-*` and `--font-size-tile` aliases are intentionally not kept; this project is still small enough to migrate consumers directly to the hitbox-first tokens. `BaseTile.module.css` keeps only local state variables such as the currently selected visible edges and result gradient stop slots.

**BaseTile is not the hitbox.** The visual card derives from `--tile-visual-short-edge` and `--tile-visual-long-edge`; square `--tile-hitbox-size` wrappers belong to consuming regions that need interaction cells or rotation-safe pool footprints.

**CSS classes are reserved for the public styling hook.** `BaseTile` keeps the CSS Module class on the root element so callers can compose layout classes predictably, while internal visual state and child roles use `data-tile-*` attributes. This keeps the stylesheet readable with nested selectors and avoids exporting class names for implementation-only spans or same-element variants.
