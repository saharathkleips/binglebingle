# components/button

Shared game button primitives for fixed system controls. The button keeps the native hitbox stable while moving an inner surface for hover/focus/press feedback, using the shared fixed system depth tokens.

## Exports

- `Button` — shared `<button>` wrapper with depth surface and common DOM hooks. Consumers provide local class names for footprint, shape, and layout.
- `ButtonProps` — props for `Button`.
- `ButtonText` — layered depth/stroke/gradient text treatment for button labels.
- `ButtonTextProps` — props for `ButtonText`.
