import { describe, it, expect } from "vitest";
import { gsap } from "./register";
import {
  animatePickUp,
  animateReposition,
  animateSnapBackFromRect,
  clearTileEntranceSnapBackSuppressions,
  discardPendingTileSnapBack,
  hasPendingTileSnapBack,
  popPendingTileSnapBack,
  recordTileSnapBack,
  shouldSuppressTileEntranceForSnapBack,
} from "./drag-animations";

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
      if (prop === "cloneNode") return () => mockElement();
      if (prop === "setAttribute" || prop === "removeAttribute" || prop === "remove") {
        return () => {};
      }
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

describe("tile snap-back registry", () => {
  it("records and consumes a pending tile rect", () => {
    recordTileSnapBack(7, mockElement());

    expect(hasPendingTileSnapBack(7)).toBe(true);
    expect(shouldSuppressTileEntranceForSnapBack(7)).toBe(true);
    expect(popPendingTileSnapBack(7)).toMatchObject({ shouldLiftOnArrival: false });
    expect(hasPendingTileSnapBack(7)).toBe(false);
    expect(shouldSuppressTileEntranceForSnapBack(7)).toBe(true);

    clearTileEntranceSnapBackSuppressions([7]);
    expect(shouldSuppressTileEntranceForSnapBack(7)).toBe(false);
  });

  it("stores the arrival lift hint when requested", () => {
    recordTileSnapBack(9, mockElement(), { shouldLiftOnArrival: true });

    expect(popPendingTileSnapBack(9)).toMatchObject({ shouldLiftOnArrival: true });
    clearTileEntranceSnapBackSuppressions([9]);
  });

  it("discards a pending tile rect without suppressing entrance", () => {
    recordTileSnapBack(10, mockElement());

    discardPendingTileSnapBack(10);

    expect(hasPendingTileSnapBack(10)).toBe(false);
    expect(shouldSuppressTileEntranceForSnapBack(10)).toBe(false);
  });
});

describe("animateSnapBackFromRect", () => {
  it("returns a GSAP Tween with snap-back timing", () => {
    const sourceElement = mockElement();
    recordTileSnapBack(8, sourceElement);
    const snapshot = popPendingTileSnapBack(8);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(mockElement(), snapshot);
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    expect(tween.vars.duration).toBe(0.3);
    expect(tween.vars.ease).toBe("back.out(1.2)");
    tween.kill();
  });
});
