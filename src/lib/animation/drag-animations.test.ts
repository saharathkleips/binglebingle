import { describe, it, expect } from "vitest";
import { gsap } from "./register";
import { animatePickUp, animateReposition } from "./drag-animations";

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

describe("animatePickUp", () => {
  it("returns a GSAP Tween", () => {
    const tween = animatePickUp(mockElement());
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    tween.kill();
  });
});

describe("animateReposition", () => {
  it("returns a GSAP Tween with snap-back timing", () => {
    const tween = animateReposition(mockElement());
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    expect(tween.vars.duration).toBe(0.3);
    expect(tween.vars.ease).toBe("back.out(1.2)");
    tween.kill();
  });
});
