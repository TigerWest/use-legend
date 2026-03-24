"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported, useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

export type UseDevicePixelRatioOptions = ConfigurableWindow;

export interface UseDevicePixelRatioReturn extends Supportable {
  /** Current device pixel ratio */
  pixelRatio$: ReadonlyObservable<number>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useDevicePixelRatio(
  options?: UseDevicePixelRatioOptions
): UseDevicePixelRatioReturn {
  const opts$ = useMaybeObservable<UseDevicePixelRatioOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);

  const isSupported$ = useSupported(() => {
    const win = window$.get();
    return !!win && "matchMedia" in win;
  });
  const pixelRatio$ = useObservable(window$.peek()?.devicePixelRatio ?? 1);

  useMount(() => {
    const win = window$.peek();
    if (!win || !win.matchMedia) return;

    let cleanup: (() => void) | undefined;

    const update = () => {
      pixelRatio$.set(win.devicePixelRatio ?? 1);
      cleanup?.();
      const media = win.matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`);
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
