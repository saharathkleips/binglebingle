# SPEC Module Convention

Co-located SPEC.md files live alongside code and tests in each module folder.
They are the implementation reference — written before coding starts and kept
accurate as the module evolves. A SPEC is useful in two phases:

- **Draft:** reason through design before writing code — open questions,
  tentative decisions, things to validate.
- **Stable:** permanent record of how the code came to be, including dead ends.
  "We tried X and it broke Y" is as load-bearing as the current behavior.

Higher-level SPECs describe cross-cutting concerns and link to lower-level ones.

## Format

````markdown
# SPEC: module-name

**Status:** draft | stable
**Module:** `src/path/to/module/`

## Purpose

What problem this module solves. Describe scope and data flow — what comes
in, what goes out, what it calls into, and what it has no knowledge of.

## File Map

​`
src/path/to/module/
├── file.ts        # brief note
└── file.test.ts
​`

## Types

Full type definitions. Repeated from README intentionally — SPEC is the
implementation reference and should be self-contained.

## Functions

### functionName(args) => ReturnType

Intended behavior. Rules, invariants, and edge cases. What returns null and
when. If a previous approach was tried and abandoned, include it here: what
was attempted and what broke or didn't hold up. That negative knowledge is
as load-bearing as the current behavior.

## Key Decisions

Module-level decisions that span multiple functions or affect the overall
design — not tied to a single function. Same rule: include dead ends.

---

<!-- Remove this section when stable -->

## Open Questions

- Unresolved design questions while status is draft.
- Remove when answered — answers become Function or Key Decisions entries.
````
