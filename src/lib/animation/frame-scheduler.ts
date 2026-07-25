/**
 * @file frame-scheduler.ts
 *
 * Small browser/Node-safe scheduling helper for DOM animation cleanup work.
 */

/** Schedules work for the next animation frame, falling back to a zero-delay timer. */
export function scheduleNextFrame(callback: FrameRequestCallback): void {
  const schedule =
    globalThis.requestAnimationFrame ??
    ((nextCallback: FrameRequestCallback) => {
      globalThis.setTimeout(nextCallback, 0);
      return 0;
    });

  schedule(callback);
}
