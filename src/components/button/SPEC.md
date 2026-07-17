# SPEC: components/button

**Status:** draft

## Purpose

Provides shared button structure and motion for non-tile game controls. Feature modules keep semantic behavior, sizing, shape, icon assets, and ornaments local while `Button` owns the stable native hitbox, moving depth surface, hover/focus lift, active press, and disabled opacity behavior. Buttons use fixed system chrome depth tokens instead of tile-scaled depth tokens, but the two elevation systems stay thematically linked through shared colors, shadow construction, and motion behavior.

## File Map

```txt
button/
├── Button.tsx          # shared button and layered text primitives
├── Button.module.css   # shared depth, surface, motion, and text treatment
├── README.md
└── SPEC.md
```

## Key Decisions

- Use a React component rather than CSS-only composition so nav actions and submission controls share the same DOM structure, not just the same declarations.
- Keep dimensions and shapes out of `Button.module.css`; consumers pass `className` and `surfaceClassName` for local footprint/radius/layout rules.
- Use fixed system chrome depth tokens for button rest, hover, focus, and pressed states so navigation and submit controls do not inherit larger game-piece shadows at wider viewport tiers. Button-local aliases such as `--button-depth` keep consumer spacing readable while preserving a separate control elevation system.
- Keep the cast shadow visually anchored while the inner surface moves for hover/focus/press feedback. Lifted and pressed shadow offsets compensate for the surface transform so the control reads as moving relative to a stable shadow rather than dragging the shadow with it.
- `ButtonText` is separate so icon-only buttons can use the same surface without rendering redundant text layers.
