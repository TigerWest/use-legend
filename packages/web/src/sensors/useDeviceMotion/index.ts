"use client";
import type { ReadonlyObservable, PermissionAware, Supportable } from "@usels/core";
import { useSupported, usePermissionAware } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { batch } from "@legendapp/state";
import { defaultWindow } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";

interface DeviceMotionEventiOS {
  requestPermission: () => Promise<"granted" | "denied">;
}

export interface UseDeviceMotionReturn extends Supportable, PermissionAware {
  /**
   * Whether the device has real motion sensor hardware.
   * `isSupported` only checks API availability — desktop browsers expose the API
   * but may fire events with non-zero interval yet all-null values when no hardware exists.
   * `hasRealData$` becomes `true` on the first event where `interval > 0` AND at least
   * one of acceleration or rotationRate has a non-null value.
   */
  hasRealData$: ReadonlyObservable<boolean>;
  /** Linear acceleration of the device (without gravity), in m/s² */
  acceleration$: ReadonlyObservable<{ x: number | null; y: number | null; z: number | null }>;
  /** Linear acceleration of the device (including gravity), in m/s² */
  accelerationIncludingGravity$: ReadonlyObservable<{
    x: number | null;
    y: number | null;
    z: number | null;
  }>;
  /** Rate of rotation of the device around each axis, in deg/s */
  rotationRate$: ReadonlyObservable<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  }>;
  /** Interval (in ms) at which the device obtains motion data */
  interval$: ReadonlyObservable<number>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useDeviceMotion(): UseDeviceMotionReturn {
  const isSupported$ = useSupported(() => !!defaultWindow && "DeviceMotionEvent" in defaultWindow);

  // useSupported evaluates after mount (via isMounted check), so this is SSR/hydration safe
  const isRequired$ = useSupported(
    () =>
      typeof (DeviceMotionEvent as unknown as DeviceMotionEventiOS).requestPermission === "function"
  );

  const { permissionState$, permissionGranted$, needsPermission$, ensurePermission } =
    usePermissionAware({
      isSupported$,
      isRequired$,
      requestPermission: async () => {
        const result = await (
          DeviceMotionEvent as unknown as DeviceMotionEventiOS
        ).requestPermission();
        return result === "granted";
      },
    });

  const acceleration$ = useObservable<{ x: number | null; y: number | null; z: number | null }>({
    x: null,
    y: null,
    z: null,
  });

  const accelerationIncludingGravity$ = useObservable<{
    x: number | null;
    y: number | null;
    z: number | null;
  }>({ x: null, y: null, z: null });

  const rotationRate$ = useObservable<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  }>({ alpha: null, beta: null, gamma: null });

  const interval$ = useObservable<number>(0);
  const hasRealData$ = useObservable<boolean>(false);

  // Always attach the listener. On non-iOS it fires immediately.
  // On iOS, events are not dispatched until permission is granted,
  // so the listener is harmless until ensurePermission() is called.
  useEventListener("devicemotion", (event: DeviceMotionEvent) => {
    batch(() => {
      const acc = event.acceleration;
      acceleration$.set({
        x: acc?.x ?? null,
        y: acc?.y ?? null,
        z: acc?.z ?? null,
      });

      const accGrav = event.accelerationIncludingGravity;
      accelerationIncludingGravity$.set({
        x: accGrav?.x ?? null,
        y: accGrav?.y ?? null,
        z: accGrav?.z ?? null,
      });

      const rot = event.rotationRate;
      rotationRate$.set({
        alpha: rot?.alpha ?? null,
        beta: rot?.beta ?? null,
        gamma: rot?.gamma ?? null,
      });

      interval$.set(event.interval);
      const hasValues =
        acc?.x !== null ||
        acc?.y !== null ||
        acc?.z !== null ||
        rot?.alpha !== null ||
        rot?.beta !== null ||
        rot?.gamma !== null;
      if (event.interval > 0 && hasValues) hasRealData$.set(true);
    });
  });

  return {
    isSupported$,
    permissionState$,
    permissionGranted$,
    needsPermission$,
    ensurePermission,
    hasRealData$,
    acceleration$,
    accelerationIncludingGravity$,
    rotationRate$,
    interval$,
  };
}
