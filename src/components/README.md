# components

React UI layer for Binglebingle. Renders game state and dispatches actions — no business logic lives here.

## Contracts

- All state is read via `useGame()` — never call `useContext` directly
- All mutations go through `dispatch` — no direct state modification
- Domain logic calls (evaluation, validation, resolution) are kept in `src/lib/`; components only call into lib at interaction boundaries
- Styling: CSS Modules only — each component has a colocated `.module.css` file; global design tokens live in `src/index.css`; no inline `style` props except for values that must be dynamic
