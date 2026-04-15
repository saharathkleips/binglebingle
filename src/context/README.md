# context

Stateful bridge between `src/lib/` (pure logic) and `src/components/` (UI). Each subfolder is a distinct stateful domain backed by a React Context provider.

## Subfolders

- `game/` — game state machine: pool, submission, guesses (`GameProvider`, `useGame`)
