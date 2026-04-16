# README Module Convention

Co-located README.md files live alongside code and tests in each module folder.
They describe purpose and contracts — not implementation — so they stay accurate
as internals evolve. Higher-level READMEs summarize and link to lower-level ones.

## Format

```markdown
# module-name

Purpose — one sentence for focused modules, a short paragraph where the domain
warrants more context.

## Exports

- `TypeName` — what it represents
- `functionName(args) => ReturnType` — what it does; key behavioral guarantees
  (e.g. when `null` is returned, ordering promises, purity)
```
