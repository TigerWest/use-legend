import { observable } from "@legendapp/state";
import type { DeepMaybeObservable, ReadonlyObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createDeviceOrientation } from "../useDeviceOrientation/core";
import { createScreenOrientation } from "../../browser/useScreenOrientation/core";
import { createMouseInElement } from "../../elements/useMouseInElement/core";

export type UseParallaxSource = "deviceOrientation" | "mouse";

export interface UseParallaxOptions {
  /** Adjust device orientation tilt value */
  deviceOrientationTiltAdjust?: (value: number) => number;
  /** Adjust device orientation roll value */
  deviceOrientationRollAdjust?: (value: number) => number;
  /** Adjust mouse tilt value */
  mouseTiltAdjust?: (value: number) => number;
  /** Adjust mouse roll value */
  mouseRollAdjust?: (value: number) => number;
}

export interface UseParallaxReturn {
  /** Roll value. Scaled to -0.5 ~ 0.5 */
  roll$: ReadonlyObservable<number>;
  /** Tilt value. Scaled to -0.5 ~ 0.5 */
  tilt$: ReadonlyObservable<number>;
  /** Sensor source: 'deviceOrientation' or 'mouse' */
  source$: ReadonlyObservable<UseParallaxSource>;
}

const identity = (i: number) => i;

/**
 * Framework-agnostic parallax tracker. Picks the best available sensor source
 * (`deviceOrientation` when the device reports live data, otherwise `mouse`)
 * and exposes reactive `roll$` / `tilt$` observables scaled to -0.5 ~ 0.5.
 *
 * Must be called inside a `useScope` factory — it composes
 * `createDeviceOrientation`, `createScreenOrientation`, and
 * `createMouseInElement`, all of which register scope-managed listeners.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createParallax(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseParallaxOptions>
): UseParallaxReturn {
  const opts$ = observable(options);

  const orientation = createDeviceOrientation();
  const { orientation$: screenOrientation$ } = createScreenOrientation();
  const { elementX$, elementY$, elementWidth$, elementHeight$ } = createMouseInElement(target, {
    handleOutside: false,
  });

  const source$ = observable<UseParallaxSource>(() => {
    const alpha = orientation.alpha$.get();
    const gamma = orientation.gamma$.get();
    if (
      orientation.isSupported$.get() &&
      ((alpha != null && alpha !== 0) || (gamma != null && gamma !== 0))
    ) {
      return "deviceOrientation";
    }
    return "mouse";
  });

  const roll$ = observable<number>(() => {
    if (source$.get() === "deviceOrientation") {
      const screenOrientation = screenOrientation$.get() ?? "portrait-primary";
      const beta = orientation.beta$.get() ?? 0;
      const gamma = orientation.gamma$.get() ?? 0;
      let value: number;
      switch (screenOrientation) {
        case "landscape-primary":
          value = gamma / 90;
          break;
        case "landscape-secondary":
          value = -gamma / 90;
          break;
        case "portrait-secondary":
          value = beta / 90;
          break;
        case "portrait-primary":
        default:
          value = -beta / 90;
          break;
      }
      return (opts$.get()?.deviceOrientationRollAdjust ?? identity)(value);
    } else {
      const y = elementY$.get();
      const height = elementHeight$.get();
      if (height === 0) return 0;
      return (opts$.get()?.mouseRollAdjust ?? identity)(-(y - height / 2) / height);
    }
  });

  const tilt$ = observable<number>(() => {
    if (source$.get() === "deviceOrientation") {
      const screenOrientation = screenOrientation$.get() ?? "portrait-primary";
      const beta = orientation.beta$.get() ?? 0;
      const gamma = orientation.gamma$.get() ?? 0;
      let value: number;
      switch (screenOrientation) {
        case "landscape-primary":
          value = beta / 90;
          break;
        case "landscape-secondary":
          value = -beta / 90;
          break;
        case "portrait-secondary":
          value = -gamma / 90;
          break;
        case "portrait-primary":
        default:
          value = gamma / 90;
          break;
      }
      return (opts$.get()?.deviceOrientationTiltAdjust ?? identity)(value);
    } else {
      const x = elementX$.get();
      const width = elementWidth$.get();
      if (width === 0) return 0;
      return (opts$.get()?.mouseTiltAdjust ?? identity)((x - width / 2) / width);
    }
  });

  return {
    roll$: roll$ as ReadonlyObservable<number>,
    tilt$: tilt$ as ReadonlyObservable<number>,
    source$: source$ as ReadonlyObservable<UseParallaxSource>,
  };
}
