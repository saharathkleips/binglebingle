# CLAUDE.md

<!-- GSD:project-start source:PROJECT.md -->

## Project

**빙글빙글 (Binglebingle)**

A single-player Korean word-guessing game for anyone who knows Hangul — primarily native speakers, but playable by learners with solid jamo knowledge. The player is given a pool of basic Korean jamo (자모) and must construct Korean syllable characters (글자) by rotating jamo into related forms, combining them into double consonants or complex vowels, and composing them into complete syllable blocks. Each submitted guess is evaluated character-by-character as correct (right position), present (wrong position), or absent.

Fully client-side PWA deployed to GitHub Pages. No backend, no auth, no accounts.

**Core Value:** The jamo manipulation mechanic — rotate, combine, compose — must feel intuitive and satisfying. If that loop breaks or confuses, the game fails.

### Constraints

- **Tech stack**: TypeScript (strict) + React 19 + Tailwind CSS + Vite + dnd-kit — fixed by architecture docs
- **Package manager**: pnpm — never npm or yarn
- **Hosting**: GitHub Pages (static, no backend possible)
- **Unicode**: Hangul Compatibility Jamo only in application code; Hangul Jamo block used only internally in compose/decompose
- **Purity**: `src/lib/` has no React imports; domain logic is fully unit-testable in isolation
- **Reducer**: pure — no async, no side effects; `SUBMIT_GUESS` receives pre-computed `GuessRecord`
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
