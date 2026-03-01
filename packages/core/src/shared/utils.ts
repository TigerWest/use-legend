// ---------------------------------------------------------------------------
// TIER 0-B: Shared pure utility functions (VueUse equivalents, no dependencies)
// ---------------------------------------------------------------------------

export const isClient = typeof window !== "undefined" && typeof document !== "undefined";

export const noop = () => {};

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const isDef = <T>(val?: T): val is T => typeof val !== "undefined";

export const notNullish = <T>(val?: T | null): val is T => val != null;

export const isObject = (val: unknown): val is object =>
  Object.prototype.toString.call(val) === "[object Object]";

export const isIOS =
  /* #__PURE__ */ isClient &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IE11 MSStream property is not in Window typings
  !(window as any).MSStream;

export function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

export function objectPick<O extends object, T extends keyof O>(obj: O, keys: T[]): Pick<O, T> {
  return keys.reduce(
    (n, k) => {
      if (k in obj) n[k] = obj[k];
      return n;
    },
    {} as Pick<O, T>
  );
}

export function objectOmit<O extends object, T extends keyof O>(obj: O, keys: T[]): Omit<O, T> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as T))) as Omit<
    O,
    T
  >;
}

export function promiseTimeout(ms: number, throwOnTimeout = false): Promise<void> {
  return new Promise((resolve, reject) =>
    throwOnTimeout
      ? setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)
      : setTimeout(resolve, ms)
  );
}

export function increaseWithUnit(target: number, delta: number): number;
export function increaseWithUnit(target: string, delta: number): string;
export function increaseWithUnit(target: number | string, delta: number): number | string {
  if (typeof target === "number") return target + delta;
  const match = target.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!match) return target;
  const [, num, unit] = match;
  return `${Number(num) + delta}${unit}`;
}
