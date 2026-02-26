/** typeof window 우선 검사 — instanceof Window는 jsdom 환경에서 실패할 수 있음 */
export function isWindow(el: unknown): el is Window {
  return typeof window !== "undefined" && el === window;
}
