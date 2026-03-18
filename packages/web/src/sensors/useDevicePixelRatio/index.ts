"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { defaultWindow } from "@usels/core/shared/configurable";

export interface UseDevicePixelRatioReturn {
  /** Whether matchMedia is supported */
  isSupported$: ReadonlyObservable<boolean>;
  /** Current device pixel ratio */
  pixelRatio$: ReadonlyObservable<number>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useDevicePixelRatio(): UseDevicePixelRatioReturn {
  const isSupported$ = useSupported(() => !!defaultWindow && "matchMedia" in defaultWindow);
  const pixelRatio$ = useObservable(defaultWindow?.devicePixelRatio ?? 1);

  useMount(() => {
    if (!defaultWindow || !defaultWindow.matchMedia) return;

    let cleanup: (() => void) | undefined;

    const update = () => {
      pixelRatio$.set(defaultWindow!.devicePixelRatio ?? 1);
      cleanup?.();
      const media = defaultWindow!.matchMedia(
        `(resolution: ${defaultWindow!.devicePixelRatio}dppx)`
      );
      const handler = () => update();
      media.addEventListener("change", handler, { once: true });
      cleanup = () => media.removeEventListener("change", handler);
    };

    update();

    return () => {
      cleanup?.();
    };
  });

  return { isSupported$, pixelRatio$ };
}
