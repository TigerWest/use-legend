---
title: useGeolocation
category: Sensors
sidebar:
  order: 10
---

Reactively tracks the user's geographic position using the Geolocation API. Wraps `navigator.geolocation.watchPosition` with observable state and pause/resume controls.

## Demo

## Usage

```tsx twoslash
// @noErrors
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
// @noErrors
import { useGeolocation } from "@usels/web";

// Don't start watching until explicitly called
const { coords$, resume } = useGeolocation({ immediate: false });
// Later: resume() to start watching
```
