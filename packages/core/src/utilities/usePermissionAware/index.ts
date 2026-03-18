import { useObservable, useObserve, useIsMounted } from "@legendapp/state/react";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import type { PermissionAware } from "../../types";

import type { PermissionState, ReadonlyObservable } from "../../types";

export interface UsePermissionAwareOptions {
  /** Whether the API is supported in the current environment. */
  isSupported$: ReadonlyObservable<boolean>;

  /**
   * The actual browser permission request logic.
   * - Returns `true`  → treated as `"granted"`
   * - Returns `false` → treated as `"denied"`
   * - Throws           → propagated to the caller (no state change)
   *
   * Not called when `isSupported$` is false or the state is already `"granted"`.
   * Wrapped with `useLatest` internally so inline functions are safe to pass.
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Optional — when permission is conditional (e.g. DeviceMotion on iOS only).
   * If false at call time, `requestPermission` is skipped and the state becomes `"granted"` automatically.
   * Only evaluated inside `ensurePermission`, not reactively.
   */
  isRequired$?: ReadonlyObservable<boolean>;

  /**
   * Optional — query the current permission state via the Permissions API on mount.
   * Only called when `isSupported$` is true and the component is mounted.
   * Not called in SSR. Query failures silently keep the default `"prompt"` state.
   */
  queryPermission?: () => Promise<PermissionState>;

  /**
   * Optional — when this observable changes value, `queryPermission` is re-called.
   * Useful for re-checking permission state when the app context changes
   * (e.g. React Native AppState foreground event, Web Page visibilitychange).
   * Has no effect if `queryPermission` is not provided.
   */
  revalidateOn$?: ReadonlyObservable<unknown>;
}

export function usePermissionAware({
  isSupported$,
  requestPermission,
  isRequired$,
  queryPermission,
  revalidateOn$,
}: UsePermissionAwareOptions): PermissionAware {
  // Stable refs so inline functions are safe to pass on every render
  const requestPermissionRef = useLatest(requestPermission);
  const queryPermissionRef = useLatest(queryPermission);

  const isMounted$ = useIsMounted();

  // Internal mutable state — default "prompt"
  const _state$ = useObservable<PermissionState>("prompt");

  // Public computed state — "unsupported" overrides _state$ when API is unavailable
  const permissionState$ = useObservable<PermissionState>(() =>
    isSupported$.get() ? _state$.get() : "unsupported"
  );

  const permissionGranted$ = useObservable(() => permissionState$.get() === "granted");

  const needsPermission$ = useObservable(() => {
    const s = permissionState$.get();
    return s === "prompt" || s === "denied"; // "unsupported" → false
  });

  // Query permission state on mount and whenever revalidateOn$ changes
  useObserve(() => {
    if (!isMounted$.get() || !isSupported$.get()) return;
    if (!queryPermissionRef.current) return;
    revalidateOn$?.get(); // subscribe — re-runs this effect when the value changes
    queryPermissionRef
      .current()
      .then((state) => _state$.set(state))
      .catch(() => {}); // query failure keeps default "prompt"
  });

  // Stable function reference across re-renders
  const ensurePermission = useConstant(() => async (): Promise<void> => {
    if (!isSupported$.peek()) return;
    if (permissionState$.peek() === "granted") return;
    // isRequired$ === false → auto-grant without calling requestPermission
    if (isRequired$ && !isRequired$.peek()) {
      _state$.set("granted");
      return;
    }
    // Throws propagate to the caller; no state change on error
    const granted = await requestPermissionRef.current();
    _state$.set(granted ? "granted" : "denied");
  });

  return { permissionState$, permissionGranted$, needsPermission$, ensurePermission };
}
