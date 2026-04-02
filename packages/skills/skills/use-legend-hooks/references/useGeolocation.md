# useGeolocation

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the user's geographic position using the Geolocation API. Wraps `navigator.geolocation.watchPosition` with observable state and pause/resume controls.

## Usage

```tsx
import { useGeolocation } from "@usels/web";

function LocationTracker() {
  const { isSupported$, isActive$, coords$, locatedAt$, error$, pause, resume } = useGeolocation();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Status: {isActive$.get() ? "Tracking" : "Paused"}</p>
      <p>Latitude: {coords$.get().latitude}</p>
      <p>Longitude: {coords$.get().longitude}</p>
      <p>Accuracy: {coords$.get().accuracy}m</p>
      {error$.get() && <p>Error: {error$.get()?.message}</p>}
      <button onClick={pause}>Pause</button>
      <button onClick={resume}>Resume</button>
    </div>
  );
}
```

### Deferred Start

```tsx
import { useGeolocation } from "@usels/web";

// Don't start watching until explicitly called
const { coords$, resume } = useGeolocation({ immediate: false });
// Later: resume() to start watching
```

## Type Declarations

```typescript
export interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    maximumAge?: number;
    timeout?: number;
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
    coords$: ReadonlyObservable<UseGeolocationCoords>;
    locatedAt$: ReadonlyObservable<number | null>;
    error$: ReadonlyObservable<GeolocationPositionError | null>;
}
export declare function useGeolocation(options?: DeepMaybeObservable<UseGeolocationOptions>): UseGeolocationReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useGeolocation/index.ts`
- Documentation: `packages/web/src/sensors/useGeolocation/index.md`