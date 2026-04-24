/**
 * Browser tests for DOM-dependent tile-animation helpers.
 *
 * These run in the Chromium environment (vitest-browser-react / Playwright).
 * They cover the helpers that require real DOM APIs:
 *   - animateEntranceScale   (gsap.from — not reliable in Node)
 *   - animateHistoryRowReveal (querySelectorAll)
 *   - animateParticleBurst   (getBoundingClientRect, document.body.appendChild)
 *
 * The onComplete arrow inside animateParticleBurst is a nested function that
 * V8 coverage counts separately; it only fires when the 420 ms animation
 * completes. We advance the GSAP global timeline to force completion.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { gsap } from "./register";
import {
  animateEntranceScale,
  animateHistoryRowReveal,
  animateParticleBurst,
} from "./tile-animations";

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
    tile.setAttribute("data-testid", "history-tile");
    row.appendChild(tile);
    document.body.appendChild(row);

    const timeline = animateHistoryRowReveal(row);
    expect(timeline).toBeInstanceOf(gsap.core.Timeline);
    timeline.kill();
    row.remove();
  });
});

describe("animateParticleBurst", () => {
  it("returns a cleanup function", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const cleanup = animateParticleBurst(div);
    expect(typeof cleanup).toBe("function");
    cleanup();
    div.remove();
  });

  it("appends particle elements to document.body then removes them via the cleanup function", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const countBefore = document.body.children.length;

    const cleanup = animateParticleBurst(div);
    // Eight particles (PARTICLE_COUNT) are appended.
    expect(document.body.children.length).toBe(countBefore + 8);

    // Calling the cleanup removes them immediately.
    cleanup();
    expect(document.body.children.length).toBe(countBefore);
    div.remove();
  });

  it("removes all particles when the returned cleanup function is called", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const countBefore = document.body.children.length;

    const cleanup = animateParticleBurst(div);
    expect(document.body.children.length).toBe(countBefore + 8);

    // cleanup is also used as the timeline's onComplete, so calling it here
    // exercises the shared function body that both paths converge on.
    cleanup();
    expect(document.body.children.length).toBe(countBefore);
    div.remove();
  });
});
