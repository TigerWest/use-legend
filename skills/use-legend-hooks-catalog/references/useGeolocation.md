# useGeolocation

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the user's geographic position using the Geolocation API. Wraps `navigator.geolocation.watchPosition` with observable state and pause/resume controls.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useGeolocation } from "@usels/web";

    function LocationTracker() {
      const { isSupported$, isActive$, coords$, locatedAt$, error$, pause, resume } =
        useGeolocation();

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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createGeolocation } from "@usels/web";

    function LocationTracker() {
      "use scope";
      const { isSupported$, isActive$, coords$, locatedAt$, error$, pause, resume } =
        createGeolocation();

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

  </Fragment>
</CodeTabs>

### Deferred Start

```tsx
import { useGeolocation } from "@usels/web";

// Don't start watching until explicitly called
const { coords$, resume } = useGeolocation({ immediate: false });
// Later: resume() to start watching
```

## Type Declarations

```typescript
export { createGeolocation } from "./core";
export type { UseGeolocationOptions, UseGeolocationCoords, UseGeolocationReturn } from "./core";
export type UseGeolocation = typeof createGeolocation;
export declare const useGeolocation: UseGeolocation;
```

## Source

- Implementation: `packages/web/src/sensors/useGeolocation/index.ts`
- Documentation: `packages/web/src/sensors/useGeolocation/index.mdx`