/** Check typeof window first — instanceof Window can fail in jsdom environments */
export function isWindow(el: unknown): el is Window {
  return typeof window !== "undefined" && el === window;
}

export { useUnmount } from "./useUnmount";
