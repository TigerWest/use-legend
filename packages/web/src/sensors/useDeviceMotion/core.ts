import { batch, observable, type Observable } from "@legendapp/state";
import {
  createPermissionAware,
  createSupported,
  type DeepMaybeObservable,
  type PermissionAware,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

interface DeviceMotionEventiOS {
  requestPermission: () => Promise<"granted" | "denied">;
}

export type UseDeviceMotionOptions = ConfigurableWindow;

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

/**
 * Framework-agnostic reactive wrapper around the
 * [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent).
 *
 * Resolves the target window via `resolveWindowSource` (honoring
 * `options.window` for iframe / custom root scenarios), exposes acceleration,
 * rotation rate, and interval as observables, and integrates with the
 * iOS permission flow via `createPermissionAware`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createDeviceMotion(
  options?: DeepMaybeObservable<UseDeviceMotionOptions>
): UseDeviceMotionReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const isSupported$ = createSupported(() => {
    const win = win$.get();
    return !!win && "DeviceMotionEvent" in win;
  });

  // isRequired$ evaluates after mount (via createSupported's isMounted check), so SSR-safe.
  const isRequired$ = createSupported(
    () =>
      typeof globalThis !== "undefined" &&
      typeof (globalThis as { DeviceMotionEvent?: unknown }).DeviceMotionEvent !== "undefined" &&
      typeof (
        (globalThis as { DeviceMotionEvent: unknown }).DeviceMotionEvent as DeviceMotionEventiOS
      ).requestPermission === "function"
  );

  const { permissionState$, permissionGranted$, needsPermission$, ensurePermission } =
    createPermissionAware({
      isSupported$,
      isRequired$,
      requestPermission: async () => {
        const result = await (
          (globalThis as { DeviceMotionEvent: unknown }).DeviceMotionEvent as DeviceMotionEventiOS
        ).requestPermission();
        return result === "granted";
      },
    });

  const acceleration$ = observable<{ x: number | null; y: number | null; z: number | null }>({
    x: null,
    y: null,
    z: null,
  });

  const accelerationIncludingGravity$ = observable<{
    x: number | null;
    y: number | null;
    z: number | null;
  }>({ x: null, y: null, z: null });

  const rotationRate$ = observable<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  }>({ alpha: null, beta: null, gamma: null });

  const interval$ = observable<number>(0);
  const hasRealData$ = observable<boolean>(false);

  // Always attach the listener. On non-iOS it fires immediately.
  // On iOS, events are not dispatched until permission is granted,
  // so the listener is harmless until ensurePermission() is called.
  createEventListener(win$, "devicemotion", (event: Event) => {
    const e = event as DeviceMotionEvent;
    batch(() => {
      const acc = e.acceleration;
      acceleration$.set({
        x: acc?.x ?? null,
        y: acc?.y ?? null,
        z: acc?.z ?? null,
      });

      const accGrav = e.accelerationIncludingGravity;
      accelerationIncludingGravity$.set({
        x: accGrav?.x ?? null,
        y: accGrav?.y ?? null,
        z: accGrav?.z ?? null,
      });

      const rot = e.rotationRate;
      rotationRate$.set({
        alpha: rot?.alpha ?? null,
        beta: rot?.beta ?? null,
        gamma: rot?.gamma ?? null,
      });

      interval$.set(e.interval);
      const hasValues =
        acc?.x !== null ||
        acc?.y !== null ||
        acc?.z !== null ||
        rot?.alpha !== null ||
        rot?.beta !== null ||
        rot?.gamma !== null;
      if (e.interval > 0 && hasValues) hasRealData$.set(true);
    });
  });

  return {
    isSupported$,
    permissionState$,
    permissionGranted$,
    needsPermission$,
    ensurePermission,
    hasRealData$: hasRealData$ as ReadonlyObservable<boolean>,
    acceleration$: acceleration$ as ReadonlyObservable<{
      x: number | null;
      y: number | null;
      z: number | null;
    }>,
    accelerationIncludingGravity$: accelerationIncludingGravity$ as ReadonlyObservable<{
      x: number | null;
      y: number | null;
      z: number | null;
    }>,
    rotationRate$: rotationRate$ as ReadonlyObservable<{
      alpha: number | null;
      beta: number | null;
      gamma: number | null;
    }>,
    interval$: interval$ as ReadonlyObservable<number>,
  };
}
