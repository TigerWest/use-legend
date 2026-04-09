import { observable } from "@shared/observable";
import { observe, onMount } from "@primitives/useScope";
import type { PermissionAware, PermissionState, ReadonlyObservable } from "../../types";

export interface PermissionAwareOptions {
  /** Whether the API is supported in the current environment. */
  isSupported$: ReadonlyObservable<boolean>;

  /**
   * The actual browser permission request logic.
   * - Returns `true`  → treated as `"granted"`
   * - Returns `false` → treated as `"denied"`
   * - Throws           → propagated to the caller (no state change)
   *
   * Not called when `isSupported$` is false or the state is already `"granted"`.
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Optional — when permission is conditional (e.g. DeviceMotion on iOS only).
   * If false at call time, `requestPermission` is skipped and the state becomes `"granted"` automatically.
   */
  isRequired$?: ReadonlyObservable<boolean>;

  /**
   * Optional — query the current permission state via the Permissions API on mount.
   * Only called when `isSupported$` is true and the component is mounted.
   */
  queryPermission?: () => Promise<PermissionState>;

  /**
   * Optional — when this observable changes value, `queryPermission` is re-called.
   */
  revalidateOn$?: ReadonlyObservable<unknown>;
}

export function createPermissionAware({
  isSupported$,
  requestPermission,
  isRequired$,
  queryPermission,
  revalidateOn$,
}: PermissionAwareOptions): PermissionAware {
  const isMounted$ = observable(false);
  const _state$ = observable<PermissionState>("prompt");

  onMount(() => {
    isMounted$.set(true);
    return () => isMounted$.set(false);
  });

  const permissionState$ = observable<PermissionState>(() =>
    isSupported$.get() ? _state$.get() : "unsupported"
  );

  const permissionGranted$ = observable<boolean>(() => permissionState$.get() === "granted");

  const needsPermission$ = observable<boolean>(() => {
    const s = permissionState$.get();
    return s === "prompt" || s === "denied";
  });

  observe(() => {
    if (!isMounted$.get() || !isSupported$.get()) return;
    if (!queryPermission) return;
    revalidateOn$?.get();
    queryPermission()
      .then((state) => _state$.set(state))
      .catch(() => {});
  });

  const ensurePermission = async (): Promise<void> => {
    if (!isSupported$.peek()) return;
    if (permissionState$.peek() === "granted") return;
    if (isRequired$ && !isRequired$.peek()) {
      _state$.set("granted");
      return;
    }
    const granted = await requestPermission();
    _state$.set(granted ? "granted" : "denied");
  };

  return { permissionState$, permissionGranted$, needsPermission$, ensurePermission };
}
