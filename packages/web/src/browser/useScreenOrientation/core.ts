import { batch, observable, type Observable } from "@legendapp/state";
import {
  createSupported,
  onMount,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";

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
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const orientation$ = observable<OrientationType | undefined>(undefined);
  const angle$ = observable<number>(0);

  const isSupported$ = createSupported(() => {
    const win = win$.get();
    return !!win && "orientation" in win.screen;
  });

  onMount(() => {
    const win = win$.peek();
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
    const win = win$.peek();
    const o = win!.screen.orientation as ScreenOrientation & {
      lock: (type: OrientationLockType) => Promise<void>;
    };
    return o.lock(type);
  };

  const unlockOrientation = (): void => {
    if (!isSupported$.peek()) return;
    const win = win$.peek();
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
