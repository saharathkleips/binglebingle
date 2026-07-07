export type PointerSequenceEvent = {
  type: string;
  clientX: number;
  clientY: number;
};

/** Dispatch a sequence of pointer events directly on a DOM element. */
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
