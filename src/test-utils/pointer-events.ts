export type PointerSequenceEvent = {
  type: string;
  clientX: number;
  clientY: number;
};

export type DragToElementCenterOptions = {
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
