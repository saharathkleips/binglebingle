/**
 * @file demo.spec.ts
 *
 * Demo E2E test: three-guess path for the dev wiring (target word 고양이).
 * Designed to showcase compose, decompose, rotate, PRESENT, and CORRECT states.
 *
 * Tile ID map for the initial pool (고양이 fully decomposed + normalized):
 *   0:ㄱ  1:ㅏ  2:ㅇ  3:ㅏ  4:ㅇ  5:ㅇ  6:ㅣ
 *
 * tile-1 starts as ㅏ — not ㅗ — because normalizeJamo maps ㅗ to the
 * canonical first member of its rotation set ["ㅏ","ㅜ","ㅓ","ㅗ"].
 *
 * Guess 1 — 가이아: showcase ABSENT and PRESENT.
 *   Build 가, 이, 아 and deliberately place 이 in the wrong slot.
 *   Result: ABSENT · PRESENT · ABSENT
 *   Pool after: 0:ㄱ  1:ㅏ  2:ㅇ  3:ㅏ  4:ㅇ   (slot-1 keeps 이 as PRESENT)
 *
 * Guess 2 — 고아이: showcase compose→decompose→rotate→recompose to build 고.
 *   Click the PRESENT 이(5) in slot-1 to return it to the pool.
 *   Compose ㅏ(1)+ㄱ(0)→가, click 가 to decompose back to ㄱ+ㅏ,
 *   rotate ㅏ(1) three times to ㅗ, compose ㅗ(1)+ㄱ(0)→고.
 *   Result: CORRECT · ABSENT · CORRECT
 *   Pool after: 1:ㅏ  2:ㅇ  4:ㅇ   (slot-0 keeps 고, slot-2 keeps 이)
 *
 * Guess 3 — 고양이: compose 양 from the returned tiles and win.
 *   Result: CORRECT · CORRECT · CORRECT
 */

import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Simulates a pointer-events drag from source to target with visible movement.
 * Moves in small steps with delays to produce a legible drag arc in recordings.
 */
async function drag(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("Could not get bounding boxes");

  const sx = sourceBox.x + sourceBox.width / 2;
  const sy = sourceBox.y + sourceBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + targetBox.height / 2;

  const STEPS = 15;
  const STEP_DELAY_MS = 20;

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 5, sy); // exceed the 4px drag threshold

  for (let step = 1; step <= STEPS; step++) {
    const progress = step / STEPS;
    await page.mouse.move(sx + 5 + (tx - sx - 5) * progress, sy + (ty - sy) * progress);
    await page.waitForTimeout(STEP_DELAY_MS);
  }

  await page.mouse.up();
}

/** Pause between actions for demo readability. */
async function pause(page: Page, ms = 600) {
  await page.waitForTimeout(ms);
}

test("demo: guesses 가이아 → 고아이 → 고양이 to win", async ({ page }) => {
  await page.goto("/");

  const tile = (id: number) => page.getByTestId(`tile-${id}`);
  const slot = (index: number) => page.getByTestId(`slot-${index}`);
  const historyTiles = page.getByTestId("history-tile");

  // -------------------------------------------------------------------------
  // GUESS 1 — 가이아  (showcase PRESENT: 이 belongs at position 2, not 1)
  // -------------------------------------------------------------------------

  // Build 가: drag ㅏ(1) onto ㄱ(0) → tile-0 becomes 가, tile-1 removed
  await drag(page, tile(1), tile(0));
  await pause(page);
  // Build 이: drag ㅣ(6) onto ㅇ(5) → tile-5 becomes 이, tile-6 removed
  await drag(page, tile(6), tile(5));
  await pause(page);
  // Build 아: drag ㅏ(3) onto ㅇ(2) → tile-2 becomes 아, tile-3 removed
  await drag(page, tile(3), tile(2));
  await pause(page);

  // Place syllables in deliberately wrong order to produce PRESENT
  await drag(page, tile(0), slot(0)); // 가 → slot 0  (ABSENT)
  await pause(page);
  await drag(page, tile(5), slot(1)); // 이 → slot 1  (이 belongs at position 2 → PRESENT)
  await pause(page);
  await drag(page, tile(2), slot(2)); // 아 → slot 2  (ABSENT)
  await pause(page);

  await page.getByTestId("submission-button").click();
  await pause(page, 1000);

  // Board row 0: 가 ABSENT · 이 PRESENT · 아 ABSENT
  // Pool after (가 and 아 decompose on return): 0:ㄱ  1:ㅏ  2:ㅇ  3:ㅏ  4:ㅇ
  // Submission: slot-0 EMPTY · slot-1 이(tile-5, PRESENT) · slot-2 EMPTY
  await expect(historyTiles.nth(0)).toHaveAttribute("data-result", "ABSENT");
  await expect(historyTiles.nth(1)).toHaveAttribute("data-result", "PRESENT");
  await expect(historyTiles.nth(2)).toHaveAttribute("data-result", "ABSENT");

  // -------------------------------------------------------------------------
  // GUESS 2 — 고아이  (showcase compose → decompose → rotate → recompose)
  // -------------------------------------------------------------------------

  // Return the PRESENT 이(5) from slot-1 to pool so it can be placed in slot-2.
  // PRESENT tiles stay in their slot after submission; clicking the slot returns them.
  await slot(1).click();
  await pause(page);

  // Begin building 고 — but compose with the wrong vowel first to show decompose.
  // Build 가 (wrong): drag ㅏ(1) onto ㄱ(0) → tile-0 becomes 가
  await drag(page, tile(1), tile(0));
  await pause(page);

  // Decompose 가 back into ㄱ(0) + ㅏ(1) by clicking the composed tile.
  // handleClick dispatches CHARACTER_DECOMPOSE for multi-jamo tiles.
  await tile(0).click();
  await pause(page);

  // Rotate ㅏ(1) three times to reach ㅗ: ㅏ → ㅜ → ㅓ → ㅗ
  await tile(1).click(); // ㅏ → ㅜ
  await pause(page, 400);
  await tile(1).click(); // ㅜ → ㅓ
  await pause(page, 400);
  await tile(1).click(); // ㅓ → ㅗ
  await pause(page);

  // Build 고: drag ㅗ(1) onto ㄱ(0) → tile-0 becomes 고, tile-1 removed
  await drag(page, tile(1), tile(0));
  await pause(page);
  // Build 아: drag ㅏ(3) onto ㅇ(2) → tile-2 becomes 아, tile-3 removed
  await drag(page, tile(3), tile(2));
  await pause(page);

  // Place tiles: 고→slot 0, 아→slot 1, 이→slot 2
  await drag(page, tile(0), slot(0)); // 고 → slot 0
  await pause(page);
  await drag(page, tile(2), slot(1)); // 아 → slot 1
  await pause(page);
  await drag(page, tile(5), slot(2)); // 이 → slot 2
  await pause(page);

  await page.getByTestId("submission-button").click();
  await pause(page, 1000);

  // Board row 1: 고 CORRECT · 아 ABSENT · 이 CORRECT
  // Pool after (아 decomposes on return): 1:ㅏ  2:ㅇ  4:ㅇ
  // Submission: slot-0 고(tile-0) · slot-1 EMPTY · slot-2 이(tile-5)
  await expect(historyTiles.nth(3)).toHaveAttribute("data-result", "CORRECT");
  await expect(historyTiles.nth(4)).toHaveAttribute("data-result", "ABSENT");
  await expect(historyTiles.nth(5)).toHaveAttribute("data-result", "CORRECT");

  // -------------------------------------------------------------------------
  // GUESS 3 — 고양이  (compose 양 and win)
  // -------------------------------------------------------------------------
  // Pool: 1:ㅏ  2:ㅇ  4:ㅇ

  // Build 아: drag ㅏ(1) onto ㅇ(2) → tile-2 becomes 아, tile-1 removed
  await drag(page, tile(1), tile(2));
  await pause(page);
  // Build 양: drag ㅇ(4) onto 아(2) → tile-2 becomes 양, tile-4 removed
  await drag(page, tile(4), tile(2));
  await pause(page);
  // Place 양 in the only empty slot; slots 0 and 2 are already correct.
  await drag(page, tile(2), slot(1)); // 양 → slot 1
  await pause(page);

  await page.getByTestId("submission-button").click();
  await pause(page, 2000); // hold on the winning state

  // Board row 2: all CORRECT
  await expect(historyTiles.nth(6)).toHaveAttribute("data-result", "CORRECT");
  await expect(historyTiles.nth(7)).toHaveAttribute("data-result", "CORRECT");
  await expect(historyTiles.nth(8)).toHaveAttribute("data-result", "CORRECT");
});
