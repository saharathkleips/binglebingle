/**
 * @file use-latest-ref.ts
 *
 * Small React helper for stable callbacks used by imperative drag handlers.
 */

import { useRef } from "react";

/**
 * Stores the latest value in a stable ref for imperative animation/drag callbacks.
 *
 * @param value - Value to expose through the ref.
 * @returns A stable ref whose current value is updated each render.
 */
export function useLatestRef<Value>(value: Value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
