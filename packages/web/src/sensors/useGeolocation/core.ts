import { batch, observable } from "@legendapp/state";
import {
  createSupported,
  onMount,
  peek,
  type DeepMaybeObservable,
  type Pausable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { defaultNavigator } from "@shared/configurable";

export interface UseGeolocationOptions {
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

/**
 * Framework-agnostic reactive wrapper around
 * [Geolocation.watchPosition()](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition).
 *
 * Exposes current coordinates, last update timestamp, and any error as
 * observables, plus `pause()` / `resume()` controls for the underlying
 * watcher. When `immediate` is true (default), the watcher is started in
 * `onMount`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createGeolocation(
  options?: DeepMaybeObservable<UseGeolocationOptions>
): UseGeolocationReturn {
  const opts$ = observable(options);

  const isSupported$ = createSupported(
    () => !!defaultNavigator && "geolocation" in defaultNavigator
  );

  const coords$ = observable<UseGeolocationCoords>({
    accuracy: 0,
    latitude: Infinity,
    longitude: Infinity,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  });

  const locatedAt$ = observable<number | null>(null);
  const error$ = observable<GeolocationPositionError | null>(null);
  const isActive$ = observable(false);

  let watcherId: number | undefined;

  const pause = () => {
    if (watcherId !== undefined && defaultNavigator?.geolocation) {
      defaultNavigator.geolocation.clearWatch(watcherId);
      watcherId = undefined;
    }
    isActive$.set(false);
  };

  const resume = () => {
    if (!isSupported$.peek() || !defaultNavigator) return;
    pause();
    const raw = opts$.peek();
    watcherId = defaultNavigator.geolocation.watchPosition(
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
        enableHighAccuracy: (peek(raw?.enableHighAccuracy) as boolean | undefined) ?? true,
        maximumAge: (peek(raw?.maximumAge) as number | undefined) ?? 30000,
        timeout: (peek(raw?.timeout) as number | undefined) ?? 27000,
      }
    );
    isActive$.set(true);
  };

  onMount(() => {
    const immediate = (peek(opts$.peek()?.immediate) as boolean | undefined) ?? true;
    if (immediate) {
      resume();
    }
    return () => {
      pause();
    };
  });

  return {
    isSupported$,
    coords$: coords$ as ReadonlyObservable<UseGeolocationCoords>,
    locatedAt$: locatedAt$ as ReadonlyObservable<number | null>,
    error$: error$ as ReadonlyObservable<GeolocationPositionError | null>,
    isActive$: isActive$ as ReadonlyObservable<boolean>,
    resume,
    pause,
  };
}
