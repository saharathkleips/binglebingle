# AGENTS.md

**빙글빙글 (Binglebingle)** — single-player Korean word-guessing game. Players assemble Korean syllable blocks from Hangul Compatibility Jamo by rotating, combining, decomposing, and submitting guesses evaluated as correct / present / absent.

## Environment

Locked-down Debian devcontainer. If a failure looks environmental, stop and ask.

- Use `pnpm` only; never npm or yarn
- Network/package installs may be blocked
- Git config is read-only; do not modify it

## Hard Constraints

- Application code must use Hangul Compatibility Jamo (U+3130–U+318F)
- Stack: TypeScript strict, React 19, CSS Modules, native CSS, Vite, PWA/GitHub Pages
- Do not introduce alternate frameworks, styling systems, package managers, or build tools

## Project Conventions

- Folders: `kebab-case`
- React components: `PascalCase.tsx`
- Other source files: `kebab-case.ts`
- Tests mirror source name with `.test.ts(x)`
- No index barrels; import from the file that owns the export
- No per-module README/SPEC requirement; keep useful notes in code, tests, or nearby comments

## Naming

- Prefer descriptive full words over abbreviations or single-letter names
- Booleans start with `is`, `has`, `can`, `should`
- Prefer `type` over `interface`; discriminated unions use a `kind` or `type` literal field
- React props types are named `<ComponentName>Props` and live with the component
- Event handler props use `on<Event>`; internal handlers use `handle<Event>`

## Architecture Boundaries

- `src/lib/`: domain logic; pure unless explicitly wrapping platform/UI effects such as animation
- `src/context/`: stateful bridge between lib and React UI
- Reducers/action handlers: pure, no React, no I/O, no side effects
- Components read/dispatch game state through `GameProvider`/`useGame()`
- Business logic stays in `src/lib`; components may call lib functions at interaction boundaries

## Components

- CSS Modules only; use `clsx` for conditional classes
- Avoid inline styles except for runtime-computed values
- Do not add speculative `useMemo`/`useCallback`; rely on React 19/Compiler unless profiling shows need
- If changing compact viewport breakpoints, update related layout rules together

## Tests

- Unit tests colocated with source
- Use `it.each` for functions with many input/output cases
- Component tests use Vitest Browser Mode; see `src/components/TESTING.md`
- E2E tests live in `tests/**/*.spec.ts`
- Prefer accessible selectors; use semantic data hooks for game entities
