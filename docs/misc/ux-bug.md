Chat history for a pretty impressive bug fix, just for historical record keeping.

---

❯ I have a weird UX bug - not sure what's going on, so I'll try to describe the state as
best as possible:

The pool contains - in order - ㅇ,ㅇ,ㅑ,ㅇ,ㅡ,고.

I am unable to decompose 고.

However, I am also in a state after I have submitted all characters and they came back as
CORRECT - but I manually removed them from the pool. If I start a new game and create 고,
submit it, and then remove it from the pool it decomposes just fine.

I suppose technically we shouldn't be able to play the game after we've won, but it
suggests to me there might be a potential bug here anyway since I can keep clicking around
and end up in a state where I've lost a character.

It also seems to only happen with 고 at the end.

It also seems to be that when I try clicking on 고 and after visually nothing happens try
dragging the same tile to a submission slot, it turns into another character entirely (not
ㄱ or ㅗ) very strange.

                                                         06:50 AM claude-sonnet-4-6

● Let me dig into the decompose logic and the relevant components to understand what's
happening.

● Search(pattern: "src/\*_/_.{tsx,ts}")
  ⎿  Found 51 files
src/App.test.tsx
src/main.tsx
src/vite-env.d.ts
src/lib/engine/index.ts
src/lib/jamo/index.ts
src/context/game/game-reducer.test.ts
src/lib/puzzle/index.ts
src/context/game/index.ts
src/lib/engine/validate.test.ts
src/context/game/GameContext.tsx
src/context/game/character-actions.test.ts
src/context/game/character-actions.ts
src/context/game/game-reducer.ts
src/context/game/round-actions.test.ts
src/context/game/round-actions.ts
src/context/game/submission-actions.test.ts
src/context/game/submission-actions.ts
src/lib/character/index.test.ts
src/lib/engine/scoring.test.ts
src/lib/engine/scoring.ts
src/lib/engine/validate.ts
src/lib/jamo/composition.test.ts
src/lib/jamo/index.test.ts
src/lib/jamo/rotation.test.ts
src/lib/word/index.test.ts
src/lib/character/composition.test.ts
src/lib/character/composition.ts
src/lib/character/index.ts
src/lib/character/rotation.test.ts
src/lib/character/rotation.ts
src/lib/engine/evaluate.test.ts
src/lib/engine/evaluate.ts
src/lib/jamo/composition.ts
src/lib/jamo/rotation.ts
src/lib/puzzle/index.test.ts
src/lib/word/index.ts
src/components/rack/Rack.test.tsx
src/components/composer/SubmitButton.tsx
src/components/composer/Composer.tsx
src/components/composer/Composer.test.tsx
src/components/composer/SubmitButton.test.tsx
src/components/board/Board.tsx
src/components/board/Board.test.tsx
src/components/board/BoardTile.test.tsx
src/components/board/BoardTile.tsx
src/components/rack/Rack.tsx
src/components/rack/Token.test.tsx
src/components/rack/Token.tsx
src/App.tsx
src/components/composer/SubmissionSlot.tsx
src/components/composer/SubmissionSlot.test.tsx

● Read(/workspaces/binglebingle/src/components/composer/SPEC.md)
⎿  Read 52 lines

● Read(/workspaces/binglebingle/src/components/composer/SubmissionSlot.tsx)
⎿  Read 185 lines

● Read(/workspaces/binglebingle/src/context/game/character-actions.ts)
⎿  Read 105 lines

● Read(/workspaces/binglebingle/src/context/game/game-reducer.ts)
⎿  Read 74 lines

● Read(/workspaces/binglebingle/src/components/rack/Token.tsx)
⎿  Read 228 lines

● Read(/workspaces/binglebingle/src/context/game/submission-actions.ts)
⎿  Read 95 lines

● Read(/workspaces/binglebingle/src/context/game/round-actions.ts)
⎿  Read 119 lines

● Read(/workspaces/binglebingle/src/lib/character/composition.ts)
⎿  Read 253 lines

● Read(/workspaces/binglebingle/src/lib/character/index.ts)
⎿  Read 141 lines

● Read(/workspaces/binglebingle/src/context/game/index.ts)
⎿  Read 96 lines

● Read(/workspaces/binglebingle/src/components/rack/Rack.tsx)
⎿  Read 22 lines

                                                         06:53 AM claude-sonnet-4-6

● Found the bug. In character-actions.ts, nextMissingId only looks at the current pool — it
ignores tile IDs that are currently in submission slots. When a decompose happens while
some tiles are in slots, it can assign an ID that's already being used by a slot tile.
When those slot tiles are later returned to the pool, you end up with duplicate IDs,
which breaks React's key-based reconciliation and causes pool.find(t => t.id === tileId)
to return the wrong tile.

This explains all three symptoms: clicking does nothing (the duplicated-key token has
wrong tile props), dragging inserts the wrong character (finds the first matching ID, not
the dragged one), and it's position-dependent (happens with 고 at the end because the ID
collision puts them adjacent after removal).

Compare to handleSubmitGuess which correctly accounts for submission IDs — it explicitly
includes submission slot IDs in its usedIds set. handleCharacterDecompose doesn't.

● Update(/workspaces/binglebingle/src/context/game/character-actions.ts)
⎿  Added 1 line, removed 1 line
7
8 import { compose, decompose } from "../../lib/character/composition";
9 import { getNextRotation } from "../../lib/character/rotation";
10 -import type { CharacterAction, GameState, Tile } from ".";
10 +import type { CharacterAction, GameState, SubmissionSlot, Tile } from ".";
11
12 /\*_
13 _ Advances a single-jamo pool tile to the next jamo in its rotation set.

● Update(/workspaces/binglebingle/src/context/game/character-actions.ts)
⎿  Added 1 line, removed 1 line
78 if (tile === undefined) return state;
79 const parts = decompose(tile.character);
80 if (parts === null) return state;
81 - const idB = nextMissingId(state.pool);
81 + const idB = nextMissingId(state.pool, state.submission);
82 return {
83 ...state,
84 pool: [

● Update(/workspaces/binglebingle/src/context/game/character-actions.ts)
⎿  Added 7 lines, removed 3 lines
94
95 /\*_
96 _ Returns the smallest non-negative integer not already used as a tile i
d.
97 - _ Derived purely from the pool — no stored counter needed.
97 + _ Considers both pool tiles and tiles currently held in submission slots + so
98 + _ that decompose never produces an id that collides with a slot tile.
99 _/
99 -function nextMissingId(pool: readonly Tile[]): number {
100 - const usedIds = new Set(pool.map((t) => t.id));
100 +function nextMissingId(pool: readonly Tile[], submission: readonly Submis
+sionSlot[]): number {
101 + const usedIds = new Set([
102 + ...pool.map((t) => t.id),
103 + ...submission.flatMap((s) => (s.state === "FILLED" ? [s.tileId] : [])
+),
104 + ]);
105 let id = 0;
106 while (usedIds.has(id)) id++;
107 return id;

                                                         06:53 AM claude-sonnet-4-6

● Let me verify the final state of the file:

● Read(/workspaces/binglebingle/src/context/game/character-actions.ts · from line 94)
⎿  Read 16 lines

                                                         06:53 AM claude-sonnet-4-6

● Now let me check if there are existing tests for handleCharacterDecompose that should
cover this case, and whether we should add one:

● Read(/workspaces/binglebingle/src/context/game/character-actions.test.ts)
⎿  Read 193 lines

                                                         06:54 AM claude-sonnet-4-6

● There's no regression test for the ID collision with submission slots. Let me add one:

● Update(/workspaces/binglebingle/src/context/game/character-actions.test.ts)
⎿  Added 15 lines
174 expect(next.pool[3]!.id).toBe(3);
175 });
176
177 + it("does not assign an id already held by a filled submission slot", () + => {
178 + // Tile 0 is in a submission slot — only tile 1 (가) is in the pool.
179 + // nextMissingId must skip 0 even though it is absent from the pool.
180 + const state: GameState = {
181 + targetWord: createWord("가")!,
182 + pool: [tile(1, character("가")!)],
183 + submission: [{ state: "FILLED", tileId: 0, character: character({ c
+hoseong: "ㄴ" })! }],
184 + history: [],
185 + };
186 + const next = handleCharacterDecompose(state, { tileId: 1 });
187 + expect(next.pool).toHaveLength(2);
188 + const ids = next.pool.map((t) => t.id);
189 + expect(ids).not.toContain(0); // 0 is occupied by the submission slot + tile
190 + });
191 +
192 it.each([
193 {
194 label: "single-jamo tile",

● Bash(pnpm test --reporter=verbose src/context/game/character-actions.test.ts 2>&1 | tail
-40)
⎿  > binglebingle@0.0.1 test /workspaces/binglebingle > pnpm test:typecheck && pnpm test:unit --reporter=verbose
src/context/game/character-actions.test.ts

     > binglebingle@0.0.1 test:typecheck /workspaces/binglebingle
     > tsc -b --noEmit


     > binglebingle@0.0.1 test:unit /workspaces/binglebingle
     > vitest run --reporter=verbose src/context/game/character-actions.test.ts


      RUN  v4.1.2 /workspaces/binglebingle

      ✓ src/context/game/character-actions.test.ts > handleCharacterRotateNext >
     rotates a 'choseong ㄱ → ㄴ' tile to the next jamo in its rotation set 1ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterRotateNext >
     rotates a 'jungseong ㅏ → ㅜ' tile to the next jamo in its rotation set 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterRotateNext >
     rotates a 'jongseong ㄱ → ㄴ' tile to the next jamo in its rotation set 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterRotateNext > is a
     no-op for 'unknown tile id' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterRotateNext > is a
     no-op for 'multi-jamo tile' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterRotateNext > is a
     no-op for 'non-rotatable single-jamo tile' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterCompose > reduces
     the pool by one after a valid combination 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterCompose > keeps
     targetId and removes incomingId after combination 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterCompose > produces
      the correct combined character 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterCompose > is a
     no-op for 'unknown targetId' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterCompose > is a
     no-op for 'unknown incomingId' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterCompose > is a
     no-op for 'incompatible pair (vowel + vowel)' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterDecompose >
     expands a combined tile into its component jamo 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterDecompose > keeps
     the original tile id for the first part and appends the second part with the
     next-available id 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterDecompose >
     updates the original tile in place and appends the extra tile to the end 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterDecompose > does
     not assign an id already held by a filled submission slot 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterDecompose > is a
     no-op for 'single-jamo tile' 0ms
      ✓ src/context/game/character-actions.test.ts > handleCharacterDecompose > is a
     no-op for 'unknown tile id' 0ms

      Test Files  1 passed (1)
           Tests  18 passed (18)
        Start at  06:54:24
        Duration  499ms (transform 177ms, setup 0ms, import 189ms, tests 4ms,
     environment 252ms)

                                                         06:54 AM claude-sonnet-4-6

● All 18 tests pass. Here's the summary:

Root cause: nextMissingId in character-actions.ts only looked at pool tile IDs to find a
free ID for the new tile produced by decompose. It didn't consider tiles currently held
in submission slots — so if tile ID 0 was in a slot (removed from pool), nextMissingId
would return 0, creating a second tile with the same ID as the slot tile.

When those slot tiles were later returned to the pool (via SUBMISSION_SLOT_REMOVE), the
pool would have duplicate IDs. This caused:

- React's key={tile.id} to reconcile the wrong component instances, making clicks behave
  as if on a different tile
- pool.find(t => t.id === tileId) to return the wrong tile on insert/decompose dispatch
- The specific position-sensitivity ("only with 고 at the end") because 고 was the last
  tile removed, landing beside the earlier duplicate

Fix: nextMissingId now also considers state.submission slot tile IDs — same approach
handleSubmitGuess already used when assigning IDs for decomposed absent tiles.

✻ Cooked for 4m 12s
