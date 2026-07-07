# SPEC: test-utils

## Purpose

Shared utilities for tests colocated with source files.

## Decisions

- Keep component-test pointer helpers in `src/test-utils/` rather than the root `tests/` folder because `tests/` is reserved for Playwright e2e specs.
- Keep element-dispatched pointer sequences and document-dispatched drag sequences as separate helpers because components use both direct pointer handlers and GSAP Draggable's document-level move/up behavior.
