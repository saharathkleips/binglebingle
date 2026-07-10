# SPEC: components/button

**Status:** draft

## Purpose

Provides shared button structure and motion for non-tile game controls. Feature modules keep semantic behavior, sizing, shape, icon assets, and ornaments local while `Button` owns the stable native hitbox, moving depth surface, hover/focus lift, active press, and disabled opacity behavior.

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
- Use fixed `--system-*` depth tokens so shared buttons do not inherit responsive tile shadow scale.
- `ButtonText` is separate so icon-only buttons can use the same surface without rendering redundant text layers.
