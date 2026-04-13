# Milestone: Game State

**Status:** Pending
**Requirements:** STAT-01, STAT-02, STAT-03

## Goal

GameState and the full GameAction discriminated union typed; gameReducer() is a pure function that handles all actions correctly; GameContext and useGame() expose state and dispatch to React components.

## Requirements

- [ ] **STAT-01**: GameState and GameAction types defined — full discriminated union with ROTATE_TOKEN, COMBINE_TOKENS, SPLIT_TOKEN, PLACE_TOKEN, REMOVE_FROM_SLOT, SUBMIT_GUESS, RESET_ROUND
- [ ] **STAT-02**: gameReducer() is a pure function (no async, no side effects); createInitialGameState(word) produces the initial state; correct submission slots stay filled after guess
- [ ] **STAT-03**: GameContext and useGame() hook expose game state and dispatch to the component tree

## Success Criteria

1. Every action type in the GameAction union is handled by the reducer without TypeScript errors
2. gameReducer() returns state unchanged for invalid actions (e.g. rotating a non-rotatable jamo, combining two jamo with no rule)
3. After SUBMIT_GUESS with all-correct evaluation, correct submission slots remain filled and present/absent tokens return to pool
4. useGame() hook returns both state and dispatch; wrapping a component in GameProvider gives it access to game state
