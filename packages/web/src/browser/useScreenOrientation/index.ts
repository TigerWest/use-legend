"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported, useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { batch } from "@legendapp/state";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

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

/*@__NO_SIDE_EFFECTS__*/
export function useScreenOrientation(
  options?: UseScreenOrientationOptions
): UseScreenOrientationReturn {
  const opts$ = useMaybeObservable<UseScreenOrientationOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);

  const isSupported$ = useSupported(() => {
    const win = window$.get();
    return !!win && "orientation" in win.screen;
  });

  const screenOrientation = window$.peek()?.screen?.orientation;
  const orientation$ = useObservable<OrientationType | undefined>(
    screenOrientation?.type as OrientationType | undefined
  );
  const angle$ = useObservable<number>(screenOrientation?.angle ?? 0);

  useMount(() => {
    const win = window$.peek();
    if (!win?.screen?.orientation) return;
    const orientation = win.screen.orientation;

    const update = () => {
      batch(() => {
        orientation$.set(orientation.type as OrientationType);
        angle$.set(orientation.angle);
      });
    };

    orientation.addEventListener("change", update);
    return () => orientation.removeEventListener("change", update);
  });

  const lockOrientation = (type: OrientationLockType): Promise<void> => {
    if (!isSupported$.peek()) return Promise.reject(new Error("Not supported"));
    const o = window$.peek()!.screen.orientation as ScreenOrientation & {
      lock: (type: OrientationLockType) => Promise<void>;
    };
    return o.lock(type);
  };

  const unlockOrientation = (): void => {
    if (!isSupported$.peek()) return;
    window$.peek()!.screen.orientation.unlock();
  };

  return { isSupported$, orientation$, angle$, lockOrientation, unlockOrientation };
}
