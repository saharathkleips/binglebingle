# Phase 1: Scaffold - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

A working Vite + React 19 + TypeScript (strict) project exists with Tailwind CSS v4, pnpm, oxlint, and oxfmt all configured and enforced. Vitest and Playwright are also set up so subsequent phases can write tests immediately. No application logic, no GitHub Actions CI — just a green, buildable, lintable scaffold.

</domain>

<decisions>
## Implementation Decisions

### Tailwind CSS
- **D-01:** Use Tailwind CSS v4 (not v3). CSS-first config — no `tailwind.config.js`. Import via `@import 'tailwindcss'` in `src/index.css`. Use `@tailwindcss/vite` plugin.

### TypeScript
- **D-02:** Strict mode with `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`. No `any`. No path aliases (`@/` or `~/`). No barrel files.

### Testing setup
- **D-03:** Set up both Vitest (jsdom environment) and Playwright in Phase 1. `pnpm test` runs Vitest; `pnpm e2e` runs Playwright. Colocated unit tests alongside source files; E2E tests in `tests/` at repo root.

### Dependency scope
- **D-04:** Install only Phase 1 deps: React 19, Vite, TypeScript, Tailwind v4 + `@tailwindcss/vite`, oxlint, oxfmt, Vitest, `@vitest/coverage-v8`, `jsdom`, Playwright. Do not pre-install @dnd-kit, vite-plugin-pwa, or other phase-specific packages.

### GitHub Actions
- **D-05:** Defer CI/CD (ci.yml, deploy.yml) to a later phase. Phase 1 delivers only the local scaffold.

### GitHub Pages base path
- **D-06:** Vite `base` config must be set to `'/binglebingle/'` for GitHub Pages compatibility. Set this now even though deploy is deferred.

### Package manager
- **D-07:** pnpm only. Never npm or yarn.

### Claude's Discretion
- Vite config details (plugins ordering, server port, etc.)
- Exact oxlint ruleset / which rule groups to enable
- Playwright browser targets (chromium only is fine for MVP)
- Initial placeholder content in `src/App.tsx` (just needs to render without errors)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture and conventions
- `docs/architecture.md` — System overview, layer boundaries, key decisions; read §"Build & Deploy" for GitHub Pages config
- `docs/conventions.md` — Naming, import rules, TypeScript constraints, anti-patterns (non-negotiable)

### Requirements
- `.planning/REQUIREMENTS.md` §SCAF-01, SCAF-02 — Exact acceptance criteria for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components, hooks, or utilities.

### Established Patterns
- None yet — this phase establishes the patterns all subsequent phases follow.

### Integration Points
- `src/index.css` — Tailwind v4 entry point (`@import 'tailwindcss'`)
- `vite.config.ts` — Must include `@tailwindcss/vite` plugin and `base: '/binglebingle/'`
- `tsconfig.json` — Must include `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in `compilerOptions`
- `vitest.config.ts` (or inline in `vite.config.ts`) — jsdom environment for React component tests
- `playwright.config.ts` — E2E config pointing at `tests/` directory

</code_context>

<specifics>
## Specific Ideas

- No specific requirements beyond what's in decisions — open to standard Vite scaffold approach.

</specifics>

<deferred>
## Deferred Ideas

- GitHub Actions ci.yml and deploy.yml — deferred to a later phase (v2 requirement CI-01, CI-02)
- vite-plugin-pwa — deferred to Phase 9 or a v2 phase
- @dnd-kit/core — deferred to Phase 8
- All other v1 packages — installed in their respective phases

</deferred>

---

*Phase: 01-scaffold*
*Context gathered: 2026-04-06*
