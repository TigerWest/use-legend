"use client";
import { useMaybeObservable, useInitialPick, useSupported } from "@usels/core";
import type { ReadonlyObservable, DeepMaybeObservable, Supportable, Pausable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { batch } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import { type ConfigurableNavigator, defaultNavigator } from "@shared/configurable";

export interface UseGeolocationOptions extends ConfigurableNavigator {
  /** Use high accuracy mode */
  enableHighAccuracy?: boolean;
  /** Maximum age of a cached position in ms */
  maximumAge?: number;
  /** Timeout for position request in ms */
  timeout?: number;
  /** Start watching immediately on mount (default: true) */
  immediate?: boolean;
}

export interface UseGeolocationCoords {
  readonly accuracy: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly speed: number | null;
}

export interface UseGeolocationReturn extends Supportable, Pausable {
  /** Current position coordinates */
  coords$: ReadonlyObservable<UseGeolocationCoords>;
  /** Timestamp of last successful position update */
  locatedAt$: ReadonlyObservable<number | null>;
  /** Last geolocation error */
  error$: ReadonlyObservable<GeolocationPositionError | null>;
  // isActive$, pause, resume → Pausable
}

/*@__NO_SIDE_EFFECTS__*/
export function useGeolocation(
  options?: DeepMaybeObservable<UseGeolocationOptions>
): UseGeolocationReturn {
  const opts$ = useMaybeObservable(options, { navigator: "element" });
  const { immediate } = useInitialPick(opts$, { immediate: true });
  const nav = opts$.peek()?.navigator ?? defaultNavigator;

  const isSupported$ = useSupported(() => !!nav && "geolocation" in nav);

  const coords$ = useObservable<UseGeolocationCoords>({
    accuracy: 0,
    latitude: Infinity,
    longitude: Infinity,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  });

  const locatedAt$ = useObservable<number | null>(null);
  const error$ = useObservable<GeolocationPositionError | null>(null);
  const isActive$ = useObservable(false);

  const state = useConstant(() => ({ watcherId: undefined as number | undefined }));

  const pause = useConstant(() => () => {
    if (state.watcherId !== undefined && nav?.geolocation) {
      nav.geolocation.clearWatch(state.watcherId);
      state.watcherId = undefined;
    }
    isActive$.set(false);
  });

  const resume = useConstant(() => () => {
    if (!isSupported$.peek() || !nav) return;
    pause();
    state.watcherId = nav.geolocation.watchPosition(
      (position) => {
        batch(() => {
          locatedAt$.set(position.timestamp);
          coords$.set({
            accuracy: position.coords.accuracy,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          });
          error$.set(null);
        });
      },
      (err) => {
        error$.set(err);
      },
      {
        enableHighAccuracy: opts$.enableHighAccuracy.peek() ?? true,
        maximumAge: opts$.maximumAge.peek() ?? 30000,
        timeout: opts$.timeout.peek() ?? 27000,
      }
    );
    isActive$.set(true);
  });

  useMount(() => {
    if (immediate) {
      resume();
    }
    return () => {
      pause();
    };
  });

  return {
    isSupported$,
    coords$,
    locatedAt$,
    error$,
    isActive$,
    resume,
    pause,
  };
}
