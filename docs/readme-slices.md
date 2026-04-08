# README Slice Convention

Co-located README.md files live alongside code and tests in each module folder.
They describe purpose and contracts — not implementation — so they stay accurate
as internals evolve. Higher-level READMEs summarize and link to lower-level ones.

## Format

```markdown
# folder-name

Purpose — one sentence for focused modules, a short paragraph where the domain
warrants more context.

## Contracts

What callers can rely on. Each entry names the export and states its guarantee.
Written as behavioural promises, not implementation notes.

## Out of scope

What this module explicitly does NOT handle. Helps readers (and agents) know
where not to look.

## Dependencies

List by directory path, followed by a high-level description of what this module relies on it for. Omit the section entirely if there are none. Do not list specific imports — those diverge as code changes.
```

