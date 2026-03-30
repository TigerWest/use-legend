"use client";
import type { ReadonlyObservable, MaybeElement, DeepMaybeObservable } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { useDeviceOrientation } from "../useDeviceOrientation";
import { useScreenOrientation } from "../../browser/useScreenOrientation";
import { useMouseInElement } from "../../elements/useMouseInElement";

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

/*@__NO_SIDE_EFFECTS__*/
export function useParallax(
  target: MaybeElement,
  options?: DeepMaybeObservable<UseParallaxOptions>
): UseParallaxReturn {
  const opts$ = useMaybeObservable(options, {
    deviceOrientationTiltAdjust: "function",
    deviceOrientationRollAdjust: "function",
    mouseTiltAdjust: "function",
    mouseRollAdjust: "function",
  });

  const orientation = useDeviceOrientation();
  const { orientation$: screenOrientation$ } = useScreenOrientation();
  const { elementX$, elementY$, elementWidth$, elementHeight$ } = useMouseInElement(target, {
    handleOutside: false,
  });

  const source$ = useObservable<UseParallaxSource>(() => {
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

  const roll$ = useObservable<number>(() => {
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
      return (opts$.peek()?.deviceOrientationRollAdjust ?? identity)(value);
    } else {
      const y = elementY$.get();
      const height = elementHeight$.get();
      if (height === 0) return 0;
      return (opts$.peek()?.mouseRollAdjust ?? identity)(-(y - height / 2) / height);
    }
  });

  const tilt$ = useObservable<number>(() => {
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
      return (opts$.peek()?.deviceOrientationTiltAdjust ?? identity)(value);
    } else {
      const x = elementX$.get();
      const width = elementWidth$.get();
      if (width === 0) return 0;
      return (opts$.peek()?.mouseTiltAdjust ?? identity)((x - width / 2) / width);
    }
  });

  return {
    roll$,
    tilt$,
    source$,
  };
}
