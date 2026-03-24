"use client";
import type { ReadonlyObservable, PermissionAware, Supportable } from "@usels/core";
import { useSupported, usePermissionAware, useMaybeObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { batch } from "@legendapp/state";
import { type ConfigurableWindow } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

interface DeviceOrientationEventiOS {
  requestPermission: () => Promise<"granted" | "denied">;
}

export type UseDeviceOrientationOptions = ConfigurableWindow;

export interface UseDeviceOrientationReturn extends Supportable, PermissionAware {
  /**
   * Whether the device has real orientation sensor hardware.
   * `isSupported` only checks API availability — desktop browsers expose the API
   * but fire events with all-null values when no hardware exists.
   * `hasRealData$` becomes `true` on the first event where any of alpha/beta/gamma is non-null.
   */
  hasRealData$: ReadonlyObservable<boolean>;
  /** Whether the orientation data is absolute (relative to the Earth's coordinate frame) */
  isAbsolute$: ReadonlyObservable<boolean>;
  /** Rotation around the z-axis in degrees (0–360) */
  alpha$: ReadonlyObservable<number | null>;
  /** Rotation around the x-axis in degrees (-180–180) */
  beta$: ReadonlyObservable<number | null>;
  /** Rotation around the y-axis in degrees (-90–90) */
  gamma$: ReadonlyObservable<number | null>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useDeviceOrientation(
  options?: UseDeviceOrientationOptions
): UseDeviceOrientationReturn {
  const opts$ = useMaybeObservable<UseDeviceOrientationOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);

  const isSupported$ = useSupported(
    () => !!window$.get() && "DeviceOrientationEvent" in window$.get()!
  );

  // useSupported evaluates after mount (via isMounted check), so this is SSR/hydration safe
  const isRequired$ = useSupported(
    () =>
      typeof (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission ===
      "function"
  );

  const { permissionState$, permissionGranted$, needsPermission$, ensurePermission } =
    usePermissionAware({
      isSupported$,
      isRequired$,
      requestPermission: async () => {
        const result = await (
          DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
        ).requestPermission();
        return result === "granted";
      },
    });

  const hasRealData$ = useObservable<boolean>(false);
  const isAbsolute$ = useObservable<boolean>(false);
  const alpha$ = useObservable<number | null>(null);
  const beta$ = useObservable<number | null>(null);
  const gamma$ = useObservable<number | null>(null);

  useEventListener(window$, "deviceorientation", (event: DeviceOrientationEvent) => {
    batch(() => {
      isAbsolute$.set(event.absolute);
      alpha$.set(event.alpha);
      beta$.set(event.beta);
      gamma$.set(event.gamma);
      if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
        hasRealData$.set(true);
      }
    });
  });

  return {
    isSupported$,
    permissionState$,
    permissionGranted$,
    needsPermission$,
    ensurePermission,
    hasRealData$,
    isAbsolute$,
    alpha$,
    beta$,
    gamma$,
  };
}
