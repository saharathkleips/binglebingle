# components

React UI layer for Binglebingle. Renders game state and dispatches actions — no business logic lives here.

## Contracts

- All state is read via `useGame()` — never call `useContext` directly
- All mutations go through `dispatch` — no direct state modification
- Domain logic calls (evaluation, validation, resolution) are kept in `src/lib/`; components only call into lib at interaction boundaries
- Styling: Tailwind only; use `cn` from `src/lib/utils/cn.ts` for conditional classes

## Dependencies

- `src/state/` — `useGame()`, `GameProvider`, `GameAction`
- `src/lib/engine/` — `canSubmit`
- `src/lib/character/` — `resolveCharacter`
- `src/lib/jamo/` — `getNextRotation`
