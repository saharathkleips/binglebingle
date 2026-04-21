# E2E Tests — Cookbook

Playwright tests live here. `smoke.spec.ts` checks the page loads. `demo.spec.ts` is a full three-guess walkthrough used as a visual demo.

---

## Selectors

| What                          | Selector                                |
| ----------------------------- | --------------------------------------- |
| Pool tile by tile ID          | `page.getByTestId("tile-{id}")`         |
| Submission slot by position   | `page.getByTestId("slot-{index}")`      |
| Submission button             | `page.getByTestId("submission-button")` |
| History tiles (all, in order) | `page.getByTestId("history-tile")`      |

History tiles accumulate across guesses — the first guess fills `.nth(0–2)`, the second fills `.nth(3–5)`, and so on.

---

## Tile ID System

Every jamo or syllable in the pool has a numeric ID. These IDs are **stable until the tile is absorbed by a compose** — at that point the source tile's ID disappears and the target tile's ID becomes the composed syllable.

**Initial pool** for the dev target word 고양이 (jamo fully decomposed + normalized):

```
0:ㄱ  1:ㅏ  2:ㅇ  3:ㅏ  4:ㅇ  5:ㅇ  6:ㅣ
```

**Normalization**: vowels are stored as the first member of their rotation set. ㅗ normalizes to ㅏ because the set is `["ㅏ","ㅜ","ㅓ","ㅗ"]`. This is why tile-1 is ㅏ, not ㅗ.

**After compose** (e.g. drag ㅏ(1) onto ㄱ(0)):

- tile-0 becomes 가; tile-1 ceases to exist
- Track which IDs have been absorbed — they cannot be referenced again

**After decompose** (click a composed tile):

- The tile keeps its original ID and becomes the first component (onset)
- The second component (vowel/coda) is assigned the **lowest unused ID**

**After a guess — ABSENT tiles return**:

- Each returned syllable decomposes into its jamo
- The syllable's own ID stays with the first jamo (onset)
- Each additional jamo gets the next lowest unused ID

**PRESENT tiles do not auto-return** — they stay in their slot. Click the slot to send the tile back to the pool (it returns as the composed syllable, not decomposed).

**CORRECT tiles stay** in their slot permanently.

---

## Actions

### Drag

```typescript
async function drag(page: Page, source: Locator, target: Locator) { ... }
```

Simulates `pointerdown → move → pointerup`. The move exceeds the 4px drag threshold used by `Tile.tsx` before heading to the destination. Used for:

- **Tile → tile**: compose two jamo into a syllable (drag source onto target; target becomes the syllable, source is absorbed)
- **Tile → slot**: place a syllable into a submission slot
- **Slot → slot**: move a tile between slots (not yet wired up as of initial demo)

For **demo/recording** use the slow version with intermediate steps:

```typescript
const STEPS = 15;
const STEP_DELAY_MS = 20;
await page.mouse.move(sx, sy);
await page.mouse.down();
await page.mouse.move(sx + 5, sy); // exceed threshold
for (let step = 1; step <= STEPS; step++) {
  const progress = step / STEPS;
  await page.mouse.move(sx + 5 + (tx - sx - 5) * progress, sy + (ty - sy) * progress);
  await page.waitForTimeout(STEP_DELAY_MS);
}
await page.mouse.up();
```

### Click

Single click on a tile has two effects depending on context:

| Target                                 | Effect                                              |
| -------------------------------------- | --------------------------------------------------- |
| Composed syllable (multi-jamo) in pool | Decompose back to component jamo                    |
| Single jamo in pool                    | Rotate to next in its set (e.g. ㅏ→ㅜ→ㅓ→ㅗ→ㅏ)     |
| PRESENT tile in a slot                 | Return the tile (as-is, not decomposed) to the pool |

### Rotation sets

Vowel rotation cycles. Three clicks on ㅏ reaches ㅗ:

```
ㅏ → ㅜ → ㅓ → ㅗ → ㅏ …
```

Other rotation sets exist for double consonants and compound vowels — check `src/lib/jamo` for the full lists.

---

## Guess Results

After submitting, each history tile gets a `data-result` attribute:

```typescript
await expect(page.getByTestId("history-tile").nth(0)).toHaveAttribute("data-result", "CORRECT");
await expect(page.getByTestId("history-tile").nth(1)).toHaveAttribute("data-result", "PRESENT");
await expect(page.getByTestId("history-tile").nth(2)).toHaveAttribute("data-result", "ABSENT");
```

Evaluation is **character (syllable block) level**, not jamo level. A tile is PRESENT if that exact syllable block appears in the target word but at a different position.

---

## Pool State Tracking Recipe

The most common source of bugs in these tests is losing track of tile IDs. A comment block per guess helps:

```
// Pool: 0:ㄱ  1:ㅏ  2:ㅇ  3:ㅏ  4:ㅇ  5:ㅇ  6:ㅣ
// after drag ㅏ(1) onto ㄱ(0):   0:가  2:ㅇ  3:ㅏ  4:ㅇ  5:ㅇ  6:ㅣ
// after drag ㅣ(6) onto ㅇ(5):   0:가  2:ㅇ  3:ㅏ  4:ㅇ  5:이
// after drag ㅏ(3) onto ㅇ(2):   0:가  2:아  4:ㅇ  5:이
// slots: 0→가(0)  1→이(5)  2→아(2)   pool leftover: 4:ㅇ
// submit → ABSENT · PRESENT · ABSENT
// returned: 가(0)→ㄱ(0)+ㅏ(1)   아(2)→ㅇ(2)+ㅏ(3)   이(5) stays in slot-1
// pool after: 0:ㄱ  1:ㅏ  2:ㅇ  3:ㅏ  4:ㅇ   slot-1: 이(5)
```

---

## Pauses (demo tests only)

```typescript
async function pause(page: Page, ms = 600) {
  await page.waitForTimeout(ms);
}
```

Use `pause()` between every drag and click for readability. Use `pause(page, 1000)` after each submission and `pause(page, 2000)` after the final winning submission so the video doesn't cut off.
