---
title: useDevicesList
category: Sensors
sidebar:
  order: 7
---

Reactively enumerates media input/output devices via the `MediaDevices` API. Provides filtered lists for video inputs (cameras), audio inputs (microphones), and audio outputs (speakers). Automatically updates when devices are connected or disconnected.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useDevicesList } from "@usels/web";

function DevicesDisplay() {
  const {
    isSupported$,
    devices$,
    videoInputs$,
    audioInputs$,
    audioOutputs$,
    permissionGranted$,
    ensurePermissions,
  } = useDevicesList();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Total devices: {devices$.get().length}</p>
      <p>Cameras: {videoInputs$.get().length}</p>
      <p>Microphones: {audioInputs$.get().length}</p>
      <p>Speakers: {audioOutputs$.get().length}</p>
      {!permissionGranted$.get() && (
        <button onClick={() => ensurePermissions()}>Grant Permissions</button>
      )}
    </div>
  );
}
```

### Requesting Permissions on Mount

```tsx twoslash
// @noErrors
import { useDevicesList } from "@usels/web";

// Automatically request permissions when the component mounts
const { devices$ } = useDevicesList({ requestPermissions: true });
```

### Reactive options

Options can be passed as plain values, per-field `Observable`s, or a single `Observable<UseDevicesListOptions>`. Changes are picked up reactively.

```typescript
import { observable } from "@legendapp/state";
import { useDevicesList } from "@usels/web";

const constraints$ = observable<MediaStreamConstraints>({ audio: true, video: true });

const { ensurePermissions } = useDevicesList({
  constraints: constraints$,
  onUpdated: (devices) => console.log("Updated:", devices.length),
});

// Later: update constraints reactively
constraints$.set({ audio: true, video: false });
```

## Notes

**`options` is `DeepMaybeObservable`.** Each option field can be a plain value or an `Observable`. The `onUpdated` callback and `constraints` are read at call time, so changes take effect on the next `ensurePermissions()` or device change. `requestPermissions` is mount-time-only.
