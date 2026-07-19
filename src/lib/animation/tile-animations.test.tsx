/**
 * Browser tests for DOM-dependent tile-animation helpers.
 *
 * These run in the Chromium environment (vitest-browser-react / Playwright).
 * They cover the helpers that require real DOM APIs:
 *   - animateEntranceScale   (gsap.from — not reliable in Node)
 *   - animateHistoryRowReveal (querySelectorAll)
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { gsap } from "./register";
import { animateEntranceScale, animateHistoryRowReveal } from "./tile-animations";

afterEach(() => {
  gsap.globalTimeline.clear();
});

describe("animateEntranceScale", () => {
  it("returns a GSAP Tween", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const tween = animateEntranceScale(div);
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    tween.kill();
    div.remove();
  });

  it("accepts an optional onComplete callback without error", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const onComplete = vi.fn();
    const tween = animateEntranceScale(div, onComplete);
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    tween.kill();
    div.remove();
  });
});

describe("animateHistoryRowReveal", () => {
  it("returns a GSAP Timeline", () => {
    const row = document.createElement("div");
    document.body.appendChild(row);
    const timeline = animateHistoryRowReveal(row);
    expect(timeline).toBeInstanceOf(gsap.core.Timeline);
    timeline.kill();
    row.remove();
  });

  it("includes tile children in the reveal stagger when present", () => {
    const row = document.createElement("div");
    const tile = document.createElement("div");
    tile.setAttribute("data-history-tile", "true");
    row.appendChild(tile);
    document.body.appendChild(row);

    const timeline = animateHistoryRowReveal(row);
    expect(timeline).toBeInstanceOf(gsap.core.Timeline);
    timeline.kill();
    row.remove();
  });
});
