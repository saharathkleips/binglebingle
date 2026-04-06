# Phase 1: Scaffold - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the Q&A.

**Date:** 2026-04-06
**Phase:** 01-Scaffold
**Mode:** discuss
**Areas discussed:** Tailwind version, Testing setup timing, Dependency scope, GitHub Actions CI setup

## Questions and Answers

### Tailwind version
| Question | Options | Selected |
|----------|---------|----------|
| Which version of Tailwind CSS? | v4 (CSS-first, current) / v3 (config-file, stable) | **v4** |

### Testing setup timing
| Question | Options | Selected |
|----------|---------|----------|
| Set up Vitest and Playwright in Phase 1? | Both in Phase 1 / Vitest only / Defer both | **Both in Phase 1** |

### Dependency scope
| Question | Options | Selected |
|----------|---------|----------|
| How broad should Phase 1 deps be? | Scaffold-only / All known v1 deps upfront | **Scaffold-only** |

### GitHub Actions CI setup
| Question | Options | Selected |
|----------|---------|----------|
| Set up CI/CD in Phase 1? | Yes (ci.yml + deploy.yml) / Defer to later phase | **Defer to later phase** |

## Corrections Made

None — all options confirmed as presented.

## Deferred Ideas

- GitHub Actions CI/CD → v2 phase (CI-01, CI-02)
- @dnd-kit/core → Phase 8
- vite-plugin-pwa → Phase 9 or v2
