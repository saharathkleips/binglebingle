# CLAUDE.md

**빙글빙글 (Binglebingle)** — single-player Korean word-guessing game. Player is given a pool of jamo and constructs Korean syllable characters by rotating jamo into related forms, combining them into double consonants or complex vowels, and composing them into syllable blocks. Guesses are evaluated character-by-character as correct / present / absent.

## Non-Negotiable Constraints

- **Package manager**: pnpm only — never npm or yarn
- **Unicode**: Hangul Compatibility Jamo (U+3130–U+318F) in all application code
- **Stack**: TypeScript strict + React 19 + Tailwind CSS v4 + Vite, deployed as a PWA on GitHub Pages — do not introduce alternatives

## File & Folder Naming

- Folders: `kebab-case`; React components: `PascalCase.tsx`; everything else: `kebab-case.ts`
- Tests: mirror source name + `.test.ts(x)`
- Each module folder has a `README.md` — see `docs/templates/slices-readme.md` for the format
- No index barrels — import directly from the file that owns the export

## Naming

- `camelCase` variables/params, `SCREAMING_SNAKE_CASE` module-level constants, `PascalCase` types/components
- Booleans: prefix with `is`, `has`, `can`, `should`
- Prefer `type` over `interface`; no `I` prefix; discriminated unions always have a `kind` or `type` literal field
- Props type named `<ComponentName>Props` in the same file; no default exports from component files
- Event handler props: `on<Event>`; internal handlers: `handle<Event>`

## React Patterns

Component file order: imports → types → file-local constants → component → sub-components → helpers.

Never call `useContext` directly — always use the typed wrapper hook exported from the context file (e.g. `useGame()` from `GameContext.tsx`).

React 19 with the React Compiler handles memoization automatically — no speculative `useMemo` or `useCallback`.

## Domain Logic (`src/lib/`)

1. No React imports — nothing from react
2. Pure functions only — no mutation, no I/O
3. All exported functions explicitly typed — no inferred return types
4. No `throw` in validation/evaluation — return a typed result instead

## State (`src/state/`)

1. Reducer must be pure — no async, no side effects
2. Every action type in the `GameAction` discriminated union
3. No fall-through between reducer cases — extract a shared helper instead

## Styling

- Tailwind only — no custom CSS except `src/index.css` for base resets and design tokens
- No inline `style` props except for values that can't be expressed as Tailwind classes
- Use `cn` (`clsx` + `tailwind-merge`) for conditional classes; `cn` lives at `src/lib/utils/cn.ts`

## Tests

Unit tests colocated with source. Naming: `describe('<fn>')` → `it('<does what> when <condition>')`. Use `it.each` for functions with many input/output cases. Run `pnpm test:coverage` to find gaps.

E2E tests in `tests/**/*.spec.ts`. Test observable UI behavior only; use `data-testid` for selectors.

## Comments

- JSDoc `@param`/`@returns` on every exported function in `src/lib/`
- Explain _why_, not _what_; no commented-out code

## Reference Docs

- `docs/architecture.md` — system design, layer boundaries, key decisions
- `docs/plan-*.md` — per-domain implementation specs (jamo, models, engine, UI, etc.)
- `docs/ROADMAP.md` — phase plan and progress
- `docs/REQUIREMENTS.md` — requirements and completion status
- `src/*/README.md` — read before working in a slice
