# SPEC: components/tile

**Status:** draft

## Purpose

Provides reusable tile presentation for Binglebingle without coupling visual identity to any single game surface. Data flows from consuming components into a small visual primitive as already-renderable content, or into a character wrapper as a `Character` that is resolved for display.

**Boundaries:**

- Reads from: component props only.
- Dispatches to: nothing.
- Calls into: `src/lib/character` only from `CharacterTile` for display resolution.
- Does not call into: game context, reducers, pool logic, submission logic, history logic, or GSAP from `BaseTile`.

The module is intentionally not an interaction layer. Drag/drop, tap, hit testing, reducer dispatches, invalid-drop recovery, submission readiness, history result semantics, and instruction-specific layout remain owned by their feature modules.

## File Map

```txt
tile/
├── BaseTile.tsx             # Shared visual primitive; no game state, no GSAP, no character resolution
├── BaseTile.module.css      # Shared tile visual identity and narrow visual variants
├── CharacterTile.tsx        # Resolves a game Character and renders BaseTile
├── use-tile-feedback.ts     # Optional shared feedback hook if multiple contexts share the exact contract
├── README.md
└── SPEC.md
```

## Types

Planned public types are documented here before implementation so later tasks can keep the API narrow.

```ts
type BaseTileProps = {
  children: React.ReactNode;
  className?: string;
  dataAttributes?: Record<`data-${string}`, string | number | boolean>;
  element?: "button" | "div" | "span";
  isDisabled?: boolean;
  isHighlighted?: boolean;
  isInteractive?: boolean;
  label?: string;
  onAnimationEnd?: React.AnimationEventHandler<HTMLElement>;
  size?: "standard" | "compact";
  testId?: string;
  tileRef?: React.Ref<HTMLElement>;
  tone?: "default" | "correct" | "present" | "absent";
};

type CharacterTileProps = Omit<BaseTileProps, "children"> & {
  character: Character;
};
```

The exact prop set may shrink during implementation. Add a new prop only when at least one current consumer needs that visual state.

## Components

### BaseTile

Renders tile content with the shared tile surface: dimensions, border, face, shadow, typography, and visual-only variants. It may render as a different element when semantics require it, but it must not own behavior for that element beyond passing safe DOM props needed for presentation and accessibility.

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

Optional hook for a later task. It may exist only if more than one context needs the same feedback animation contract.

Rules:

- Keep GSAP setup outside `BaseTile`.
- Prefer context-specific animation code when sharing would hide important behavior.
- Do not introduce a generic `AnimatedTile` layer unless consumers need the exact same contract.

## Key Decisions

**Visual primitive before behavior migration.** The first implementation step is documentation only. Code migration should happen after the API boundaries are explicit so pool drag mechanics do not leak into the base visual layer.

**Character resolution is separate from base visuals.** `BaseTile` receives display content and therefore stays reusable for history result markers, instruction examples, empty/future visual states, and any non-character tile-like content. `CharacterTile` is the convenience wrapper for game characters.

**Feature modules own semantics.** Pool tiles can be draggable and tappable, submission slots can swap or return tiles, history tiles can show evaluation tones, and instructions can render examples. Those behaviors are outside this module even when they share the same visual surface.

**DOM hooks are pass-through only.** `tileRef`, `dataAttributes`, `testId`, and `onAnimationEnd` exist so feature modules can attach their own semantics to the same visual element. `BaseTile` must not interpret those attributes or callbacks.

**Use visual names, not source-context names.** Shared props should describe appearance (`tone="correct"`, `isHighlighted`) rather than the module that caused it (`isHistoryCorrect`, `isDropTarget`). This keeps the primitive redesignable without importing feature concepts.

## Open Questions

- Which current tile dimensions and state variants should become the initial `BaseTile.module.css` contract during TILE-02?
- Should `BaseTile` support `button` directly, or should interactive consumers wrap a non-button visual surface when they need complex drag/drop behavior?
- Whether shared feedback belongs in `useTileFeedback` depends on the TILE-05 migration and should not be decided before comparing actual consumers.
