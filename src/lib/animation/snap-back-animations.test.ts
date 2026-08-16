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
import {
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_SLOT_STATE_ATTRIBUTE,
  DATA_TILE_HOVER_SUPPRESSED_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  DATA_TILE_TEXT_ATTRIBUTE,
  dataAttributeSelector,
} from "../dom-data-attributes";

/**
 * GSAP can animate plain objects in Node — we use a proxy that
 * accepts any property assignment so CSSPlugin writes don't fail.
 */
type MockElementOptions = {
  clone?: HTMLElement;
  textElement?: { textContent: string };
  onRemove?: () => void;
  isHovered?: boolean | (() => boolean);
};

function mockStyle(): CSSStyleDeclaration {
  return new Proxy({ setProperty: vi.fn() } as unknown as CSSStyleDeclaration, {
    get: (target, prop) => Reflect.get(target, prop) ?? "",
    set: (target, prop, value) => Reflect.set(target, prop, value),
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
    matches: (selector: string) => {
      const isHovered =
        typeof options.isHovered === "function" ? options.isHovered() : options.isHovered;
      return selector === ":hover" && isHovered === true;
    },
    addEventListener: vi.fn(),
    querySelector: (selector: string) => {
      if (selector === dataAttributeSelector(DATA_TILE_TEXT_ATTRIBUTE)) {
        return options.textElement ?? null;
      }
      return null;
    },
  };

  return element as unknown as HTMLElement;
}

function stubAnimationFrames(): Array<FrameRequestCallback> {
  const callbacks: Array<FrameRequestCallback> = [];
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    }),
  );
  return callbacks;
}

function runAnimationFrames(callbacks: Array<FrameRequestCallback>): void {
  callbacks.splice(0).forEach((callback) => callback(0));
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
    expect(popPendingTileSnapBack(7)).toMatchObject({ clone: expect.anything() });
    expect(hasPendingTileSnapBack(7)).toBe(false);
    expect(shouldSuppressTileEntranceForSnapBack(7)).toBe(true);

    clearTileEntranceSnapBackSuppressions([7]);
    expect(shouldSuppressTileEntranceForSnapBack(7)).toBe(false);
  });

  it("stores delayed clone-text updates for animation start", () => {
    recordTileSnapBack(17, mockElement(), {
      cloneText: "ㄱ",
      cloneTextTiming: "on-start",
      delay: 0.42,
    });

    expect(popPendingTileSnapBack(17)).toMatchObject({
      cloneTextOnStart: "ㄱ",
      delay: 0.42,
    });
    clearTileEntranceSnapBackSuppressions([17]);
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
    expect(clone.removeAttribute).toHaveBeenCalledWith(DATA_SLOT_INDEX_ATTRIBUTE);
    expect(clone.removeAttribute).toHaveBeenCalledWith(DATA_SLOT_STATE_ATTRIBUTE);
    expect(clone.removeAttribute).toHaveBeenCalledWith(DATA_TILE_ID_ATTRIBUTE);
    expect(clone.setAttribute).toHaveBeenCalledWith("aria-hidden", "true");
    discardPendingTileSnapBack(12);
  });

  it("keeps snap-back clones visible before movement by default", () => {
    const clone = mockElement();

    recordTileSnapBack(19, mockElement({ clone }));

    expect(clone.style.visibility).toBe("visible");
    discardPendingTileSnapBack(19);
  });

  it("allows delayed snap-back clones to stay hidden until movement starts", () => {
    const clone = mockElement();

    recordTileSnapBack(20, mockElement({ clone }), { initialVisibility: "hidden-until-start" });

    expect(clone.style.visibility).toBe("hidden");
    discardPendingTileSnapBack(20);
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
  it("returns a GSAP Tween with accepted-drop timing", () => {
    const sourceElement = mockElement();
    recordTileSnapBack(8, sourceElement);
    const snapshot = popPendingTileSnapBack(8);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(mockElement(), snapshot);
    expect(tween).toBeInstanceOf(gsap.core.Tween);
    expect(tween.vars.duration).toBe(0.26);
    expect(tween.vars.ease).toBe("power3.out");
    tween.kill();
  });

  it("runs completion callbacks", () => {
    const clone = mockElement();
    const destinationElement = mockElement();
    const onComplete = vi.fn();
    recordTileSnapBack(14, mockElement({ clone }));
    const snapshot = popPendingTileSnapBack(14);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(destinationElement, snapshot, onComplete);
    tween.vars.onComplete?.();

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("suppresses hover lift on a destination until the pointer leaves", () => {
    const animationFrameCallbacks = stubAnimationFrames();
    const clone = mockElement();
    const destinationElement = mockElement({ isHovered: true });
    recordTileSnapBack(19, mockElement({ clone }));
    const snapshot = popPendingTileSnapBack(19);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(destinationElement, snapshot);
    tween.vars.onComplete?.();
    runAnimationFrames(animationFrameCallbacks);

    expect(destinationElement.setAttribute).toHaveBeenCalledWith(
      DATA_TILE_HOVER_SUPPRESSED_ATTRIBUTE,
      "true",
    );
    expect(destinationElement.addEventListener).toHaveBeenCalledWith(
      "pointerleave",
      expect.any(Function),
      { once: true },
    );

    expect(destinationElement.removeAttribute).not.toHaveBeenCalledWith(
      DATA_TILE_HOVER_SUPPRESSED_ATTRIBUTE,
    );

    const pointerLeaveListener = vi.mocked(destinationElement.addEventListener).mock.calls[0]?.[1];
    if (typeof pointerLeaveListener !== "function") {
      throw new Error("Expected a pointerleave listener.");
    }
    pointerLeaveListener(new Event("pointerleave"));

    expect(destinationElement.removeAttribute).toHaveBeenCalledWith(
      DATA_TILE_HOVER_SUPPRESSED_ATTRIBUTE,
    );
  });

  it("keeps hover lift suppressed when the destination becomes hovered before the settling frame", () => {
    const animationFrameCallbacks = stubAnimationFrames();
    let isHovered = false;
    const clone = mockElement();
    const destinationElement = mockElement({ isHovered: () => isHovered });
    recordTileSnapBack(20, mockElement({ clone }));
    const snapshot = popPendingTileSnapBack(20);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(destinationElement, snapshot);
    tween.vars.onComplete?.();
    isHovered = true;
    runAnimationFrames(animationFrameCallbacks);

    expect(destinationElement.removeAttribute).not.toHaveBeenCalledWith(
      DATA_TILE_HOVER_SUPPRESSED_ATTRIBUTE,
    );
    expect(destinationElement.addEventListener).toHaveBeenCalledWith(
      "pointerleave",
      expect.any(Function),
      { once: true },
    );
  });

  it("applies deferred clone text when snap-back movement starts", () => {
    const textElement = { textContent: "" };
    const clone = mockElement({ textElement });
    recordTileSnapBack(18, mockElement({ clone }), {
      cloneText: "ㄲ",
      cloneTextTiming: "on-start",
    });
    const snapshot = popPendingTileSnapBack(18);
    if (snapshot === null) throw new Error("Expected a pending snap-back snapshot.");

    const tween = animateSnapBackFromRect(mockElement(), snapshot);
    tween.vars.onStart?.();

    expect(textElement.textContent).toBe("ㄲ");
    tween.kill();
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
});
