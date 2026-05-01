/**
 * Safe `requestAnimationFrame` / `cancelAnimationFrame` helpers.
 *
 * Probes `globalThis.requestAnimationFrame` lazily on every call so the
 * surrounding module is safe to import in environments where the global
 * is absent (React Native / Expo / Hermes builds without a rAF polyfill).
 * Falls back to a ~60fps `setTimeout` shim.
 */

export function requestAnimationFrameSafe(cb: FrameRequestCallback): number {
  const raf = (globalThis as { requestAnimationFrame?: (cb: FrameRequestCallback) => number })
    .requestAnimationFrame;
  if (typeof raf === "function") return raf(cb);
  // Fallback: schedule on the next macrotask (~16ms ≈ 60fps).
  // setTimeout returns Timer in node; cast to number for the public type.
  return setTimeout(() => cb(Date.now()), 16) as unknown as number;
}

export function cancelAnimationFrameSafe(id: number): void {
  const caf = (globalThis as { cancelAnimationFrame?: (id: number) => void }).cancelAnimationFrame;
  if (typeof caf === "function") {
    caf(id);
    return;
  }
  clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
}
