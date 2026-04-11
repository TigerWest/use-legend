import { observable, type Observable } from "@legendapp/state";
import {
  createSupported,
  onMount,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";

export type UseDevicePixelRatioOptions = ConfigurableWindow;

export interface UseDevicePixelRatioReturn extends Supportable {
  /** Current device pixel ratio */
  pixelRatio$: ReadonlyObservable<number>;
}

/**
 * Framework-agnostic reactive `window.devicePixelRatio` tracker.
 *
 * Uses `matchMedia('(resolution: Ndppx)')` and re-registers the listener
 * whenever the DPR changes so callers always see the latest value.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createDevicePixelRatio(
  options?: DeepMaybeObservable<UseDevicePixelRatioOptions>
): UseDevicePixelRatioReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const isSupported$ = createSupported(() => {
    const win = win$.get();
    return !!win && "matchMedia" in win;
  });

  const pixelRatio$ = observable<number>(win$.peek()?.devicePixelRatio ?? 1);

  onMount(() => {
    const win = win$.peek();
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

  return {
    isSupported$,
    pixelRatio$: pixelRatio$ as ReadonlyObservable<number>,
  };
}
