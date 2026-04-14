# CLAUDE.md

**빙글빙글 (Binglebingle)** — single-player Korean word-guessing game. Player is given a pool of jamo and constructs Korean syllable characters by rotating jamo into related forms, combining them into double consonants or complex vowels, and composing them into syllable blocks. Guesses are evaluated character-by-character as correct / present / absent.

## Environment

Running in a locked-down devcontainer (Debian bookworm-slim). If a failure looks like an environment constraint rather than a code problem, **stop and ask** — do not attempt to work around it automatically.

- **Network**: outbound firewall — package fetches and registry calls may be blocked
- **pnpm**: supply-chain hardened — new installs or registry changes may be restricted
- **Tools**: minimal image — some CLI tools may not be present
- **Git**: config is read-only — do not attempt to modify it

## Non-Negotiable Constraints

- **Package manager**: pnpm only — never npm or yarn
- **Unicode**: Hangul Compatibility Jamo (U+3130–U+318F) in all application code
- **Stack**: TypeScript strict + React 19 + Tailwind CSS v4 + Vite, deployed as a PWA on GitHub Pages — do not introduce alternatives

## File & Folder Naming

- Folders: `kebab-case`; React components: `PascalCase.tsx`; everything else: `kebab-case.ts`
- Tests: mirror source name + `.test.ts(x)`
- Each module folder has a `README.md` (public contract) and `SPEC.md` (internals/decisions) — see `docs/templates/` for formats
- No index barrels — import directly from the file that owns the export

## Naming

- Prefer functional style (`map`/`flatMap`/`reduce`/`filter`) over imperative loops, `while`, or variable reassignment
- Limit `as` casts — if one is unavoidable, add an inline comment explaining why
- `camelCase` variables/params, `SCREAMING_SNAKE_CASE` module-level constants, `PascalCase` types/components
- Booleans: prefix with `is`, `has`, `can`, `should`
- Prefer `type` over `interface`; no `I` prefix; discriminated unions always have a `kind` or `type` literal field
- Props type named `<ComponentName>Props` in the same file; no default exports from component files
- Event handler props: `on<Event>`; internal handlers: `handle<Event>`

## Tests

Unit tests colocated with source. Naming: `describe('<fn>')` → `it('<does what> when <condition>')`. Use `it.each` for functions with many input/output cases. Run `pnpm test:coverage` to find gaps.

E2E tests in `tests/**/*.spec.ts`. Test observable UI behavior only; use `data-testid` for selectors.

## Comments

- JSDoc `@param`/`@returns` on every exported function in `src/lib/`
- Explain _why_, not _what_; no commented-out code

## Reference Docs

- `docs/architecture.md` — system design, layer boundaries, key decisions
- `docs/roadmap/` — versioned milestones; README.md has current status and next milestone
- `src/*/README.md` — high-level overview; read for general orientation
- `src/*/SPEC.md` — implementation details and decisions; read when making changes to that slice
