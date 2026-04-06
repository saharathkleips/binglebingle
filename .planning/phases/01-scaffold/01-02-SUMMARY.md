---
phase: 01-scaffold
plan: 02
subsystem: infra
tags: [oxlint, oxfmt, linting, formatting, quality-gates, typescript, react]

# Dependency graph
requires:
  - phase: 01-scaffold plan 01
    provides: "Vite + React + TypeScript scaffold with src/ entry files, package.json scripts"
provides:
  - "oxlint configured with browser env, correctness rules, and Vitest globals"
  - "oxfmt configured with .oxfmtrc.json defaults"
  - "pnpm lint exits 0 on full repo (oxlint .)"
  - "pnpm fmt:check exits 0 on full repo (oxfmt --check .)"
  - "Clean quality baseline for all subsequent phases"
affects: [all-phases, 02-jamo-core, ci]

# Tech tracking
tech-stack:
  added: [oxlint, oxfmt]
  patterns:
    - "Single-command quality gates: pnpm lint, pnpm fmt, pnpm fmt:check"
    - "ignorePatterns in .oxlintrc.json to exclude .claude/** and .planning/**"
    - "$schema points to local node_modules path for offline/air-gapped reliability"
    - "Scripts target full repo (.) not just src/ — config files and docs formatted too"

key-files:
  created:
    - .oxlintrc.json
    - .oxfmtrc.json
  modified:
    - package.json

key-decisions:
  - "$schema for .oxlintrc.json set to ./node_modules/oxlint/configuration_schema.json (local path, not remote URL — avoids 404 in air-gapped or offline environments)"
  - "lint/fmt/fmt:check scripts broadened from src/ to . (full repo) — config files and docs should also pass format checks"
  - ".eslintignore replaced by ignorePatterns inside .oxlintrc.json — single source of truth for lint exclusions"
  - "oxfmt ignorePatterns set in .oxfmtrc.json to exclude .claude/** and .planning/** from formatting"

patterns-established:
  - "Quality gate pattern: run pnpm lint && pnpm fmt:check before committing any changes"
  - "Config-first linting: all exclusions declared in oxlintrc, no inline disable comments"

requirements-completed: [SCAF-02]

# Metrics
duration: ~60min
completed: 2026-04-06
---

# Phase 01 Plan 02: Lint and Format Gates Summary

**oxlint + oxfmt quality gates configured with full-repo coverage — pnpm lint and pnpm fmt:check both exit 0 with zero violations across all 30 files**

## Performance

- **Duration:** ~60 min (including post-checkpoint fixes)
- **Started:** 2026-04-06
- **Completed:** 2026-04-06
- **Tasks:** 2 auto tasks + 1 checkpoint (verified)
- **Files modified:** 3 (`.oxlintrc.json` created, `.oxfmtrc.json` created, `package.json` updated)

## Accomplishments

- Created `.oxlintrc.json` with browser env, correctness rules, TypeScript/React/unicorn plugins, and Vitest globals
- Applied oxfmt formatting to all src/ files and subsequently all config/docs files across the full repo
- Post-checkpoint fixes broadened scripts from `src/` to `.` (full repo) and resolved schema/config issues

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .oxlintrc.json and verify oxlint passes** - `caa62da` (chore)
2. **Task 2: Run oxfmt on src/ and verify pnpm fmt:check passes** - `8b81fc7` (chore)
3. **Post-checkpoint fix: oxfmt config, broaden lint/fmt to full repo** - `04caa6d` (fix)
4. **Post-checkpoint fix: apply oxfmt to docs, config files, root TS** - `d2575cb` (chore)
5. **Post-checkpoint fix: consolidate ignores, fix $schema to local path** - `e2c5ec3` (fix)

## Files Created/Modified

- `.oxlintrc.json` — oxlint configuration: browser env, es2022, Vitest globals, correctness rules, react/typescript/unicorn plugins, ignorePatterns for .claude/** and .planning/**
- `.oxfmtrc.json` — oxfmt configuration: default settings with ignorePatterns for .claude/** and .planning/**
- `package.json` — Updated lint/fmt/fmt:check scripts to target `.` (full repo) instead of `src/`

## Decisions Made

- **Local $schema path:** `.oxlintrc.json` `$schema` was initially set to the remote GitHub URL from the plan template. Post-checkpoint it was corrected to `./node_modules/oxlint/configuration_schema.json` — the remote URL was returning 404. Local paths work reliably regardless of network access.
- **Full-repo coverage:** Scripts broadened from `src/` to `.` so config files, Playwright config, and docs/ all participate in the quality gates. This avoids a two-tier situation where source code is clean but config files drift.
- **Consolidated ignore patterns:** Deleted `.eslintignore`, moved all ignore patterns into `.oxlintrc.json` `ignorePatterns`. Single source of truth prevents confusion about which files are excluded.

## Deviations from Plan

### Post-Checkpoint Fixes (Applied After Human Verification)

The plan's checkpoint was approved. However, the following fixes were applied after checkpoint approval to address issues found during verification:

**1. [Rule 3 - Blocking] Remote $schema URL was 404ing**
- **Found during:** Post-checkpoint verification
- **Issue:** `$schema` pointed to `https://raw.githubusercontent.com/oxc-project/oxc/main/crates/oxc_linter/src/config_schema.json` which was returning 404
- **Fix:** Changed to `./node_modules/oxlint/configuration_schema.json` (local path)
- **Files modified:** `.oxlintrc.json`
- **Committed in:** `e2c5ec3`

**2. [Rule 2 - Missing Critical] oxfmt had no config file**
- **Found during:** Post-checkpoint
- **Issue:** No `.oxfmtrc.json` existed; oxfmt was running without explicit config
- **Fix:** Created `.oxfmtrc.json` with default settings and ignorePatterns for `.claude/**` and `.planning/**`
- **Files modified:** `.oxfmtrc.json` (created)
- **Committed in:** `04caa6d`

**3. [Rule 2 - Missing Critical] lint/fmt scripts targeted only src/, not full repo**
- **Found during:** Post-checkpoint
- **Issue:** `pnpm lint` ran `oxlint src/` — config files and docs in repo root were not covered; formatting drift would accumulate silently
- **Fix:** Broadened all three scripts to `.` (full repo): `oxlint .`, `oxfmt .`, `oxfmt --check .`
- **Files modified:** `package.json`
- **Committed in:** `04caa6d`

**4. [Rule 2 - Missing Critical] .eslintignore file was separate from oxlint config**
- **Found during:** Post-checkpoint
- **Issue:** `.eslintignore` was being used but oxlint reads `ignorePatterns` from `.oxlintrc.json`; the two files caused confusion
- **Fix:** Deleted `.eslintignore`, added `ignorePatterns: [".claude/**", ".planning/**"]` to `.oxlintrc.json`
- **Files modified:** `.oxlintrc.json` (added ignorePatterns), `.eslintignore` (deleted)
- **Committed in:** `e2c5ec3`

---

**Total deviations:** 4 post-checkpoint fixes (1 blocking, 3 missing-critical)
**Impact on plan:** All fixes necessary for correctness and completeness. Outcome stronger than original plan — full-repo quality enforcement rather than src/-only.

## Issues Encountered

- oxlint's remote config schema URL was not resolvable; switching to local node_modules path resolved it immediately
- Full-repo formatting required reformatting 30 files total (7 source + 23 config/docs), all passing after oxfmt pass

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Quality gate baseline is established: `pnpm lint && pnpm fmt:check` both exit 0 across 30 files
- Every subsequent phase starts from a clean lint/format state — no accumulated technical debt
- Phase 01 (Scaffold) is now complete; Phase 02 (Jamo Core) can begin

---
*Phase: 01-scaffold*
*Completed: 2026-04-06*
