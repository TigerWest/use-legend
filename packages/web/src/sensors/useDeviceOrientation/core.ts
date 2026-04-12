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

/**
 * Framework-agnostic reactive wrapper around the
 * [DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent).
 *
 * Resolves the target window via `resolveWindowSource`, exposes orientation
 * angles as observables, and integrates with the iOS permission flow via
 * `createPermissionAware`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createDeviceOrientation(
  options?: DeepMaybeObservable<UseDeviceOrientationOptions>
): UseDeviceOrientationReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const isSupported$ = createSupported(() => {
    const win = win$.get();
    return !!win && "DeviceOrientationEvent" in win;
  });

  const isRequired$ = createSupported(
    () =>
      typeof globalThis !== "undefined" &&
      typeof (globalThis as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent !==
        "undefined" &&
      typeof (
        (globalThis as { DeviceOrientationEvent: unknown })
          .DeviceOrientationEvent as DeviceOrientationEventiOS
      ).requestPermission === "function"
  );

  const { permissionState$, permissionGranted$, needsPermission$, ensurePermission } =
    createPermissionAware({
      isSupported$,
      isRequired$,
      requestPermission: async () => {
        const result = await (
          (globalThis as { DeviceOrientationEvent: unknown })
            .DeviceOrientationEvent as DeviceOrientationEventiOS
        ).requestPermission();
        return result === "granted";
      },
    });

  const hasRealData$ = observable<boolean>(false);
  const isAbsolute$ = observable<boolean>(false);
  const alpha$ = observable<number | null>(null);
  const beta$ = observable<number | null>(null);
  const gamma$ = observable<number | null>(null);

  createEventListener(win$, "deviceorientation", (event: Event) => {
    const e = event as DeviceOrientationEvent;
    batch(() => {
      isAbsolute$.set(e.absolute);
      alpha$.set(e.alpha);
      beta$.set(e.beta);
      gamma$.set(e.gamma);
      if (e.alpha !== null || e.beta !== null || e.gamma !== null) {
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
    hasRealData$: hasRealData$ as ReadonlyObservable<boolean>,
    isAbsolute$: isAbsolute$ as ReadonlyObservable<boolean>,
    alpha$: alpha$ as ReadonlyObservable<number | null>,
    beta$: beta$ as ReadonlyObservable<number | null>,
    gamma$: gamma$ as ReadonlyObservable<number | null>,
  };
}
