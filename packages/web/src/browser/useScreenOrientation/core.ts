import { batch, observable } from "@legendapp/state";
import {
  createSupported,
  onMount,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { defaultWindow, type ConfigurableWindow } from "@shared/configurable";

export type OrientationType =
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

export type OrientationLockType =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

export type UseScreenOrientationOptions = ConfigurableWindow;

export interface UseScreenOrientationReturn extends Supportable {
  orientation$: ReadonlyObservable<OrientationType | undefined>;
  angle$: ReadonlyObservable<number>;
  lockOrientation: (type: OrientationLockType) => Promise<void>;
  unlockOrientation: () => void;
}

/**
 * Resolves a window option value (plain `Window`, `OpaqueObject<Window>`, or
 * `OpaqueObject<HTMLIFrameElement>`) into a real `Window` reference.
 *
 * Falls back to `defaultWindow` when the value is null/undefined.
 */
function resolveWindow(raw: unknown): Window | undefined {
  if (raw == null) return defaultWindow;
  const val =
    typeof (raw as { valueOf?: () => unknown }).valueOf === "function"
      ? (raw as { valueOf: () => unknown }).valueOf()
      : raw;
  if (typeof HTMLIFrameElement !== "undefined" && val instanceof HTMLIFrameElement) {
    return val.contentWindow ?? undefined;
  }
  return val as Window;
}

/**
 * Framework-agnostic reactive wrapper around the
 * [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation).
 *
 * @param options - Optional `ConfigurableWindow` (defaults to global `window`).
 * @returns Observable orientation type, angle, support flag, and lock helpers.
 */
export function createScreenOrientation(
  options?: DeepMaybeObservable<UseScreenOrientationOptions>
): UseScreenOrientationReturn {
  const opts$ = observable(options);

  const orientation$ = observable<OrientationType | undefined>(undefined);
  const angle$ = observable<number>(0);

  const isSupported$ = createSupported(() => {
    const win = resolveWindow(opts$.get()?.window as unknown);
    return !!win && "orientation" in win.screen;
  });

  onMount(() => {
    const win = resolveWindow(opts$.peek()?.window as unknown);
    if (!win?.screen?.orientation) return;
    const orientation = win.screen.orientation;

    const update = () => {
      batch(() => {
        orientation$.set(orientation.type as OrientationType);
        angle$.set(orientation.angle);
      });
    };

    update();
    orientation.addEventListener("change", update);
    return () => orientation.removeEventListener("change", update);
  });

  const lockOrientation = (type: OrientationLockType): Promise<void> => {
    if (!isSupported$.peek()) return Promise.reject(new Error("Not supported"));
    const win = resolveWindow(opts$.peek()?.window as unknown);
    const o = win!.screen.orientation as ScreenOrientation & {
      lock: (type: OrientationLockType) => Promise<void>;
    };
    return o.lock(type);
  };

  const unlockOrientation = (): void => {
    if (!isSupported$.peek()) return;
    const win = resolveWindow(opts$.peek()?.window as unknown);
    win!.screen.orientation.unlock();
  };

  return {
    isSupported$,
    orientation$: orientation$ as ReadonlyObservable<OrientationType | undefined>,
    angle$: angle$ as ReadonlyObservable<number>,
    lockOrientation,
    unlockOrientation,
  };
}
