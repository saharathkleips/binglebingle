# CLAUDE.md

**빙글빙글 (Binglebingle)** — single-player Korean word-guessing game. Player is given a pool of jamo and constructs Korean syllable characters by rotating jamo into related forms, combining them into double consonants or complex vowels, and composing them into syllable blocks. Guesses are evaluated character-by-character as correct / present / absent.

## Non-Negotiable Constraints

- **Package manager**: pnpm only — never npm or yarn
- **Unicode**: Hangul Compatibility Jamo (U+3130–U+318F) in all application code
- **Stack**: TypeScript strict + React 19 + Tailwind CSS v4 + Vite, deployed as a PWA on GitHub Pages — do not introduce alternatives

## Reference Docs

- `docs/architecture.md` — system design, layer boundaries, key decisions
- `docs/conventions.md` — coding conventions (non-negotiable)
- `docs/plan-*.md` — per-domain implementation specs (jamo, models, engine, UI, etc.)
- `docs/ROADMAP.md` — phase plan and progress
- `src/*/README.md` — each source slice has a README; read it before working in that area
- `docs/REQUIREMENTS.md` — requirements and completion status
