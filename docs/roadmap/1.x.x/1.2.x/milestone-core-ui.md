# Milestone: Core UI

**Status:** Pending
**Requirements:** UI-01, UI-02, UI-03, UI-04

## Goal

Rack, Composer, and Board components rendered in the browser; a player can rotate jamo tokens, drag tokens from Rack to Composer, compose a syllable character, place it into a submission slot, and submit a guess that is evaluated and displayed on the Board.

## Requirements

- [ ] **UI-01**: Rack displays the jamo pool; player can tap a token to rotate it to the next jamo in its rotation set
- [ ] **UI-02**: Composer allows player to assemble jamo into a syllable character, combine jamo within the working area, and decompose composed jamo back into constituents
- [ ] **UI-03**: Board displays guess history as a grid; each evaluated character tile is colored by result (correct / present / absent)
- [ ] **UI-04**: Player can drag jamo tokens from Rack to Composer (pointer and touch sensors via @dnd-kit)

## Success Criteria

1. Player can tap a token in the Rack to cycle it to the next jamo in its rotation set
2. Player can drag a jamo token from the Rack to the Composer using a pointer or touch sensor
3. Player can assemble jamo into a syllable in the Composer and see the resolved character update in real time
4. Player can place a completed character into a submission slot and submit the guess
5. Submitted guess rows appear on the Board with each tile colored by its evaluation result (correct / present / absent)
