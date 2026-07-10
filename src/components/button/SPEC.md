# SPEC: components/button

**Status:** draft

## Purpose

Provides shared button structure and motion for non-tile game controls. Feature modules keep semantic behavior, sizing, shape, icon assets, and ornaments local while `Button` owns the stable native hitbox, moving depth surface, hover/focus lift, active press, and disabled opacity behavior. Button depth and lifted shadows intentionally reuse the tile depth stack so interactive surfaces share one physical language.

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
- Reuse tile depth and shadow tokens for button rest, hover, and focus states so controls and game pieces lift with matching physical depth. Button-local aliases such as `--button-depth` keep consumer spacing readable without introducing a second shadow system.
- `ButtonText` is separate so icon-only buttons can use the same surface without rendering redundant text layers.
