# useDevicesList

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively enumerates media input/output devices via the `MediaDevices` API. Provides filtered lists for video inputs (cameras), audio inputs (microphones), and audio outputs (speakers). Automatically updates when devices are connected or disconnected.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDevicesList } from "@usels/web";

    function DevicesDisplay() {
      "use scope"
      const {
        isSupported$,
        devices$,
        videoInputs$,
        audioInputs$,
        audioOutputs$,
        permissionGranted$,
        ensurePermissions,
      } = createDevicesList();

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

  </Fragment>
</CodeTabs>

### Requesting Permissions on Mount

```tsx
import { useDevicesList } from "@usels/web";

// Automatically request permissions when the component mounts
const { devices$ } = useDevicesList({ requestPermissions: true });
```

### Reactive options

Options can be passed as plain values, per-field `Observable`s, or a single `Observable<UseDevicesListOptions>`. Changes are picked up reactively.

```typescript
import { observable } from "@usels/core";
import { useDevicesList } from "@usels/web";

const constraints$ = observable<MediaStreamConstraints>({ audio: true, video: true });

const { ensurePermissions } = useDevicesList({
  constraints: constraints$,
  onUpdated: (devices) => console.log("Updated:", devices.length),
});

// Later: update constraints reactively
constraints$.set({ audio: true, video: false });
```

## Type Declarations

```typescript
export { createDevicesList } from "./core";
export type { UseDevicesListOptions, UseDevicesListReturn } from "./core";
export type UseDevicesList = typeof createDevicesList;
export declare const useDevicesList: UseDevicesList;
```

## Source

- Implementation: `packages/web/src/sensors/useDevicesList/index.ts`
- Documentation: `packages/web/src/sensors/useDevicesList/index.mdx`