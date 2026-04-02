# conventions.md
> Jamo Word Game — Coding Conventions
> Status: locked

These conventions are **non-negotiable for the coding agent**. When in doubt, follow the rule here rather than inferring from context.

---

## Package Manager

Always use **pnpm**. Never use npm or yarn.

```bash
pnpm add <package>
pnpm add -D <package>
pnpm install
pnpm run <script>
```

---

## Language & Compiler Settings

- TypeScript strict mode — `"strict": true` in `tsconfig.json`, no exceptions
- No `any`. Use `unknown` and narrow. If you genuinely need an escape hatch, use a named type alias and leave a `// TODO: tighten` comment
- No `as` casts except at validated boundaries (e.g. JSON parse results, DOM event targets). Every cast must have a comment explaining why it is safe
- `noUncheckedIndexedAccess: true` — array/object index access returns `T | undefined`; always narrow before use
- `exactOptionalPropertyTypes: true` — do not assign `undefined` to an optional property; omit the key instead

---

## File & Folder Naming

| Thing | Convention | Example |
|---|---|---|
| Folders | `kebab-case` | `src/components/rack/` |
| React component files | `PascalCase.tsx` | `RackTile.tsx` |
| Non-component TS files | `kebab-case.ts` | `jamo-data.ts`, `game-reducer.ts` |
| Test files | mirror source name + `.test.ts(x)` | `composition.test.ts` |
| Constant files | `kebab-case.ts` | `rotation-sets.ts` |

Component folders group related files with no index barrel. Import directly from the file containing what you need:

```
src/components/Rack/
├── RackRoot.tsx
├── RackTile.tsx
└── rack.types.ts
```

```typescript
// ✓ direct import
import { RackTile } from '../components/Rack/RackTile'
```

---

## Naming Conventions

### Variables and functions

- `camelCase` for all variables, function parameters, and local constants
- Prefer descriptive names — no single-letter variables except loop indices (`i`, `j`) and well-understood math (`x`, `y`)
- Boolean variables and return values: prefix with `is`, `has`, `can`, `should`

```typescript
// ✓
const isValidGuess = isGuessValid(guess, pool)
const hasJongseong = decomposed.jongseong !== undefined

// ✗
const valid = isGuessValid(guess, pool)
const check = decomposed.jongseong !== undefined
```

### Constants

- Module-level constants: `SCREAMING_SNAKE_CASE`
- Const objects/arrays that are conceptually data (not config): `SCREAMING_SNAKE_CASE`

```typescript
export const ROTATION_SETS = [...]
export const MAX_WORD_LENGTH = 5
```

### Types and interfaces

- `PascalCase` for all types, interfaces, enums
- Prefer `type` over `interface` unless declaration merging is explicitly needed
- No `I` prefix on interfaces (not `IGameState`, just `GameState`)
- Discriminated unions: always include a `kind` or `type` literal field

```typescript
type TileResult = 'green' | 'yellow' | 'gray'

type GameAction =
  | { type: 'ROTATE_JAMO'; payload: { jamoId: string; targetJamo: string } }
  | { type: 'SUBMIT_GUESS'; payload: { characters: string[] } }
  | { type: 'RESET_GAME' }
```

### React components

- `PascalCase` for component names and their files
- Props type named `<ComponentName>Props`, defined in the same file (or in `<folder>.types.ts` if shared across multiple components in the folder)
- No default exports from component files — use named exports everywhere

```typescript
// ✓
export type RackTileProps = { jamo: string; isUsed: boolean }
export function RackTile({ jamo, isUsed }: RackTileProps) { ... }

// ✗
export default function RackTile(...) { ... }
```

Exception: `App.tsx` and page-level components may use default exports if required by the router (not applicable for this project — `App.tsx` uses named export).

### Event handlers

Prefix with `handle` for component-internal handlers, `on` for props:

```typescript
// Props
type ComposerProps = { onCharacterComposed: (syllable: string) => void }

// Internal
function handleJamoDrop(event: DragEvent) { ... }
```

---

## React Patterns

### Component structure order

Within a component file, always in this order:

1. Imports
2. Type definitions (props, local types)
3. Constants local to the file
4. The component function
5. Sub-components defined in the same file (if any — keep these small)
6. Helper functions used only by this component

### Hooks

- Custom hooks live in `src/hooks/` and are named `use<Thing>.ts`
- A hook that wraps a context must be provided as a convenience export from that context file:

```typescript
// src/state/GameContext.tsx
export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
```

- Never call `useContext(GameContext)` directly in a component — always use `useGame()`

### State updates

- Never mutate state directly — always return new objects/arrays from the reducer
- Use spread for shallow copies; for nested updates produce a full new object tree
- `structuredClone` is acceptable for cloning the jamo pool frequency map at the start of validation (not in the reducer — domain logic only)

### Memoization

This project targets **React 19 with the React Compiler enabled**. The compiler handles memoization of components, callbacks, and derived values automatically — do not add manual `useMemo` or `useCallback` calls speculatively.

Manual memoization is only appropriate in two cases:
1. The React Compiler is explicitly disabled for a subtree (via `'use no memo'` directive) — document why
2. A specific, measured performance problem exists that the compiler is not resolving

If the compiler is not available in the project setup for any reason, flag this before adding manual memoization wholesale.

---

## Domain Logic Layer Rules (`src/lib/`)

These are the strictest rules in the codebase because the downstream agent is most likely to blur these boundaries.

1. **No React imports** anywhere under `src/lib/`. Not `useState`, not `useEffect`, not `ReactNode`. If you find yourself wanting to import React in `src/lib/`, you are in the wrong file.

2. **No side effects**. Functions must be pure: same input → same output, no mutation of arguments, no I/O.

3. **All functions explicitly typed**. No inferred return types on exported functions.

```typescript
// ✓
export function getRotationOptions(jamo: string): string[] { ... }

// ✗
export function getRotationOptions(jamo: string) { ... }
```

4. **No `throw` in validation/evaluation functions**. Return a typed result instead:

```typescript
type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

export function isGuessValid(guess: string[], pool: JamoPool): ValidationResult
```

5. **Test coverage required** for every exported function in `src/lib/`. A function with no test does not exist as far as the agent is concerned.

---

## State Layer Rules (`src/state/`)

1. The reducer must be a pure function — no async, no side effects, no API calls
2. Every action type must be listed in the `GameAction` discriminated union in `state/types.ts`
3. The initial state must be exported as a named constant `INITIAL_STATE` from `gameReducer.ts`
4. Reducers handle one action per `case` — no fall-through, no shared logic between cases (extract a shared helper instead)

---

## Styling

- **Tailwind utility classes only** — no custom CSS files except `src/index.css` for base resets and CSS custom properties (design tokens)
- CSS custom properties (design tokens) for the dancheong/오방색 color palette are defined in `src/index.css` under `:root` and referenced from Tailwind config via `theme.extend`
- No inline `style` props except for dynamic values that cannot be expressed as Tailwind classes (e.g. transform origins computed at runtime)
- Class strings: use `clsx` or `cn` (a `clsx` + `tailwind-merge` wrapper) for conditional classes — never string concatenation

```typescript
// ✓
import { cn } from '../../lib/utils/cn'
<div className={cn('rounded px-2', isActive && 'bg-primary', className)} />

// ✗
<div className={`rounded px-2 ${isActive ? 'bg-primary' : ''}`} />
```

- `cn` utility lives at `src/lib/utils/cn.ts` and is the only file in `src/lib/` allowed to import from a UI-adjacent package (`clsx`, `tailwind-merge`)

### Unit tests (`vitest`)

- Location: colocated with source — `src/lib/jamo/composition.test.ts` lives next to `src/lib/jamo/composition.ts`
- Every test file imports only from `src/lib/` — no React, no components, no state
- Test naming: `describe('<functionName>')` → `it('<does what> when <condition>')`

```typescript
describe('getRotationOptions', () => {
  it('returns all set members except itself for a rotatable jamo', () => { ... })
  it('returns an empty array for a non-rotatable jamo', () => { ... })
})
```

- Prefer explicit expected values over snapshots for domain logic
- No test should depend on execution order — each test is fully self-contained

### E2E tests (`playwright`)

- Location: `tests/**/*.spec.ts` — root-level `tests/` folder, separate from `src/` entirely
- Cover complete player flows (load game → build character → submit guess → see evaluation)
- Do not test implementation details — test observable UI behavior only
- Use `data-testid` attributes for stable selectors; never select by class name or text content that might change

---

## Linting & Formatting

- **oxlint** enforces rules defined in `.oxlintrc.json` at repo root — do not disable rules inline without a comment explaining why
- **oxfmt** enforces formatting — run `pnpm oxfmt src/` to format; CI fails on `pnpm oxfmt --check src/`
- No `eslint-disable` comments — oxlint does not use ESLint directives
- Imports are ordered: (1) Node built-ins, (2) external packages, (3) relative imports from parent directories `../`, (4) relative imports from the same directory `./`. A blank line between each group.

---

## Korean Text Handling

- **Never hardcode Korean syllable block characters as string literals in logic code.** Syllable blocks must be constructed via `composeSyllable()` or loaded from data files. String literals like `'가'` are only acceptable in test fixtures and puzzle data.
- **Always use Hangul Compatibility Jamo (U+3130–U+318F)** for standalone jamo display and data storage (e.g. `'ㄱ'` = U+3131). Do not use Hangul Jamo block codepoints (U+1100–U+11FF) in application code — those are for internal Unicode composition math only.
- Unicode string comparison for jamo must use strict equality (`===`) — no locale-aware collation for jamo identity checks.

---

## Comments & Documentation

- Every exported function in `src/lib/` must have a JSDoc comment with `@param` and `@returns`
- No commented-out code committed to main
- `// TODO:` comments are acceptable; they must include a description of what needs doing. `// FIXME:` for known bugs. Both are searchable and reviewable.
- Do not explain *what* the code does in comments — explain *why* if the reason is non-obvious

```typescript
// ✓ explains why
// jongseongIndex uses a different table than choseongIndex per Unicode standard (UAX #15)
const jongseongIdx = JONGSEONG_INDEX_TABLE[jamo] ?? 0

// ✗ explains what (the code already says this)
// get jongseong index
const jongseongIdx = JONGSEONG_INDEX_TABLE[jamo] ?? 0
```

---

## Git Conventions

- Branch naming: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`
- Commit messages: imperative mood, present tense — `add rotation set lookup`, not `added rotation set lookup`
- No commits directly to `main` — all changes via PR; CI must pass before merge
- Each commit should leave the codebase in a buildable, passing-tests state
