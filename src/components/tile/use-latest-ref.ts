/**
 * @file use-latest-ref.ts
 *
 * Small React helper for stable callbacks used by imperative drag handlers.
 */

import { useRef } from "react";

export function useLatestRef<Value>(value: Value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
