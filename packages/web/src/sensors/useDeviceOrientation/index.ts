"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useSupported } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { batch } from "@legendapp/state";
import { defaultWindow } from "@usels/core/shared/configurable";
import { useEventListener } from "@browser/useEventListener";

interface DeviceOrientationEventiOS {
  requestPermission: () => Promise<"granted" | "denied">;
}

export interface UseDeviceOrientationReturn {
  /** Whether the DeviceOrientationEvent API is supported */
  isSupported$: ReadonlyObservable<boolean>;
  /** Whether iOS permission is required (DeviceOrientationEvent.requestPermission exists) */
  requirePermission$: ReadonlyObservable<boolean>;
  /** Whether orientation permission has been granted */
  permissionGranted$: ReadonlyObservable<boolean>;
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
  /** Request iOS permission for DeviceOrientationEvent (no-op on non-iOS) */
  ensurePermissions: () => Promise<void>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useDeviceOrientation(): UseDeviceOrientationReturn {
  const isSupported$ = useSupported(
    () => !!defaultWindow && "DeviceOrientationEvent" in defaultWindow
  );

  const requirePermission$ = useSupported(
    () =>
      typeof (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission ===
      "function"
  );
  const permissionGranted$ = useObservable<boolean>(false);
  const hasRealData$ = useObservable<boolean>(false);
  const isAbsolute$ = useObservable<boolean>(false);
  const alpha$ = useObservable<number | null>(null);
  const beta$ = useObservable<number | null>(null);
  const gamma$ = useObservable<number | null>(null);

  useEventListener("deviceorientation", (event: DeviceOrientationEvent) => {
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

  async function ensurePermissions(): Promise<void> {
    if (!requirePermission$.get()) {
      permissionGranted$.set(true);
      return;
    }
    const result = await (
      DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
    ).requestPermission();
    permissionGranted$.set(result === "granted");
  }

  return {
    isSupported$,
    requirePermission$,
    permissionGranted$,
    hasRealData$,
    isAbsolute$,
    alpha$,
    beta$,
    gamma$,
    ensurePermissions,
  };
}
