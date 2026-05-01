/**
 * iOS detection. Lazy — never touches `navigator` / `window` at import time,
 * so this module is safe to import in React Native / Expo / Hermes builds
 * even though the function itself is only meaningful in a browser.
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined") return false;
  if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IE11 MSStream property is not in Window typings
  if ((window as any).MSStream) return false;
  return true;
}
