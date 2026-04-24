/**
 * Unit tests for tile-animations helpers.
 *
 * These run in the Node/unit environment. Only helpers that use `gsap.to()`
 * (which is lazy and doesn't need the CSS harness) can be tested here.
 * Helpers that use `gsap.from()` or DOM APIs (animateEntranceScale,
 * animateHistoryRowReveal, animateParticleBurst) are covered by the browser
 * component tests in Pool.test.tsx and HistoryArea.test.tsx.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { gsap } from "./register";
import { animateComposePulse } from "./tile-animations";

/**
 * GSAP can animate plain objects in Node — we use a proxy that
 * accepts any property assignment so CSSPlugin writes don't fail.
 */
function mockElement(): HTMLElement {
  // eslint-disable-next-line -- proxy target needs no real DOM
  return new Proxy({} as HTMLElement, {
    get(_target, prop) {
      if (prop === "style") return new Proxy({}, { set: () => true, get: () => "" });
      if (prop === "nodeType") return 1;
      if (prop === "getBoundingClientRect")
        return () => ({ top: 0, left: 0, width: 100, height: 100, bottom: 100, right: 100 });
      return undefined;
    },
    set() {
      return true;
    },
  });
}

// Kill all GSAP tweens after each test to prevent async ticker errors.
afterEach(() => {
  gsap.globalTimeline.clear();
});

describe("animateComposePulse", () => {
  it("returns a GSAP Tween", () => {
    const tween = animateComposePulse(mockElement());
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    tween.kill();
  });

  it("accepts an optional onComplete callback without error", () => {
    const onComplete = vi.fn();
    const tween = animateComposePulse(mockElement(), onComplete);
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    tween.kill();
  });
});
