import { afterEach, describe, expect, it, vi } from "vitest";
import { gsap } from "./register";
import {
  animateSnapBackFromRect,
  clearTileEntranceSnapBackSuppressions,
  discardPendingTileSnapBack,
  hasPendingTileSnapBack,
  popPendingTileSnapBack,
  recordTileSnapBack,
  shouldSuppressTileEntranceForSnapBack,
} from "./snap-back-animations";

/**
 * GSAP can animate plain objects in Node — we use a proxy that
 * accepts any property assignment so CSSPlugin writes don't fail.
 */
type MockElementOptions = {
  clone?: HTMLElement;
  surface?: HTMLElement | null;
  onRemove?: () => void;
};

function mockStyle(): CSSStyleDeclaration {
  return new Proxy({ setProperty: vi.fn() } as unknown as CSSStyleDeclaration, {
    get: (target, prop) => Reflect.get(target, prop) ?? "",
    set: () => true,
  });
}

function mockElement(options: MockElementOptions = {}): HTMLElement {
  const style = mockStyle();
  const element = {
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    style,
    nodeType: 1,
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    cloneNode: () => options.clone ?? mockElement(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    remove: vi.fn(options.onRemove),
    querySelector: () => options.surface ?? null,
  };

  return element as unknown as HTMLElement;
}

function mockSurface(): HTMLElement {
  const surface = { style: mockStyle(), offsetWidth: 100 };
  return surface as unknown as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
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

  it("ignores discard requests for tiles without pending snapshots", () => {
    discardPendingTileSnapBack(404);

    expect(hasPendingTileSnapBack(404)).toBe(false);
  });

  it("replaces earlier snapshots for the same tile", () => {
    const firstClone = mockElement();
    const secondClone = mockElement();
    recordTileSnapBack(11, mockElement({ clone: firstClone }));
    recordTileSnapBack(11, mockElement({ clone: secondClone }));

    expect(firstClone.remove).toHaveBeenCalledOnce();
    expect(popPendingTileSnapBack(11)?.clone).toBe(secondClone);
    clearTileEntranceSnapBackSuppressions([11]);
  });

  it("appends sanitized clones when a document is available", () => {
    const appendChild = vi.fn();
    const clone = mockElement();
    vi.stubGlobal("document", { body: { appendChild } });

    recordTileSnapBack(12, mockElement({ clone }));

    expect(appendChild).toHaveBeenCalledWith(clone);
    expect(clone.removeAttribute).toHaveBeenCalledWith("id");
    expect(clone.removeAttribute).toHaveBeenCalledWith("data-slot-index");
    expect(clone.removeAttribute).toHaveBeenCalledWith("data-slot-state");
    expect(clone.removeAttribute).toHaveBeenCalledWith("data-tile-id");
    expect(clone.setAttribute).toHaveBeenCalledWith("aria-hidden", "true");
    discardPendingTileSnapBack(12);
  });

  it("cleans up stale pending snapshots on the fallback timer", () => {
    vi.useFakeTimers();
    const clone = mockElement();
    recordTileSnapBack(13, mockElement({ clone }));

    vi.runOnlyPendingTimers();

    expect(hasPendingTileSnapBack(13)).toBe(false);
    expect(clone.remove).toHaveBeenCalledOnce();
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

  it("runs completion callbacks and clears arrival lift with the timeout fallback", () => {
    vi.useFakeTimers();
    vi.stubGlobal("getComputedStyle", () => ({
      getPropertyValue: (property: string) =>
        property === "--tile-hover-lift-multiplier" ? " 2 " : "",
    }));
    const cloneSurface = mockSurface();
    const destinationSurface = mockSurface();
    const clone = mockElement({ surface: cloneSurface });
    const destinationElement = mockElement({ surface: destinationSurface });
    const onComplete = vi.fn();
    recordTileSnapBack(14, mockElement({ clone }), { shouldLiftOnArrival: true });
    const snapshot = popPendingTileSnapBack(14);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(destinationElement, snapshot, onComplete);
    tween.vars.onComplete?.();
    vi.runOnlyPendingTimers();

    expect(clone.style.setProperty).toHaveBeenCalledWith("--tile-hover-lift-multiplier", "2");
    expect(onComplete).toHaveBeenCalledOnce();
    expect(destinationSurface.style.transform).toBe("");
    expect(destinationSurface.style.boxShadow).toBe("");
  });

  it("keeps cleanup idempotent when interrupted after completion", () => {
    const clone = mockElement();
    const destinationElement = mockElement();
    recordTileSnapBack(15, mockElement({ clone }));
    const snapshot = popPendingTileSnapBack(15);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(destinationElement, snapshot);
    tween.vars.onComplete?.();
    tween.vars.onInterrupt?.();

    expect(clone.remove).toHaveBeenCalledOnce();
  });

  it("ignores missing tile surfaces when clearing arrival lift", () => {
    vi.useFakeTimers();
    const clone = mockElement();
    const destinationElement = mockElement({ surface: null });
    recordTileSnapBack(16, mockElement({ clone }), { shouldLiftOnArrival: true });
    const snapshot = popPendingTileSnapBack(16);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(destinationElement, snapshot);
    tween.vars.onComplete?.();
    vi.runOnlyPendingTimers();

    expect(clone.remove).toHaveBeenCalledOnce();
  });
});
