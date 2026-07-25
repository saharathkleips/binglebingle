/**
 * Browser tests for DOM-dependent tile-animation helpers.
 *
 * These run in the Chromium environment (vitest-browser-react / Playwright).
 * They cover helpers that require real DOM APIs:
 *   - animateEntranceScale (gsap.from — not reliable in Node)
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { gsap } from "./register";
import { animateEntranceScale } from "./tile-animations";

afterEach(() => {
  gsap.globalTimeline.clear();
  document.body.replaceChildren();
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
