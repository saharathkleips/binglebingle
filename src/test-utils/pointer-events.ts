/** Pointer event shape used by low-level drag helpers. */
export type PointerSequenceEvent = {
  /** Native pointer event type to dispatch, such as `pointerdown` or `pointerup`. */
  type: string;
  /** Viewport X coordinate for the event. */
  clientX: number;
  /** Viewport Y coordinate for the event. */
  clientY: number;
};

/** Options for dragging a source element to a target element's center point. */
export type DragToElementCenterOptions = {
  /** Initial horizontal move used to exceed the draggable activation threshold. */
  activationOffset?: number;
};

/**
 * Dispatches a sequence of pointer events directly on one DOM element.
 * Use for components that handle pointer events themselves.
 */
export function pointerSequence(element: Element, events: readonly PointerSequenceEvent[]) {
  events.forEach(({ type, clientX, clientY }) => {
    element.dispatchEvent(createPointerEvent(type, clientX, clientY));
  });
}

/**
 * Dispatch a drag sequence via GSAP Draggable's event model:
 * pointerdown on the element, pointermove/pointerup on document.
 */
export function dragSequence(element: Element, events: readonly PointerSequenceEvent[]) {
  events.forEach(({ type, clientX, clientY }) => {
    const target = type === "pointerdown" ? element : document;
    target.dispatchEvent(createPointerEvent(type, clientX, clientY));
  });
}

/**
 * Drags an element to the center point of another element and releases it.
 * Thin wrapper for tests that only care about the final drop result.
 */
export function dragToElementCenter(
  sourceElement: Element,
  targetElement: Element,
  { activationOffset = 10 }: DragToElementCenterOptions = {},
) {
  const targetRectangle = targetElement.getBoundingClientRect();
  const targetCenterX = targetRectangle.left + targetRectangle.width / 2;
  const targetCenterY = targetRectangle.top + targetRectangle.height / 2;

  dragSequence(sourceElement, [
    { type: "pointerdown", clientX: 0, clientY: 0 },
    { type: "pointermove", clientX: activationOffset, clientY: 0 },
    { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
    { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
  ]);
}

function createPointerEvent(type: string, clientX: number, clientY: number) {
  return new PointerEvent(type, {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    isPrimary: true,
  });
}
