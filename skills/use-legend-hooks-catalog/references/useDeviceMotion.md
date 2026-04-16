# useDeviceMotion

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent). Provides reactive access to device acceleration and rotation rate data.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useDeviceMotion } from "@usels/web";

    function MyComponent() {
      const { acceleration$, rotationRate$, interval$, isSupported$ } = useDeviceMotion();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Acceleration X: {acceleration$.get().x}</p>
          <p>Rotation Alpha: {rotationRate$.get().alpha}</p>
          <p>Interval: {interval$.get()}ms</p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDeviceMotion } from "@usels/web";

    function MyComponent() {
      "use scope"
      const { acceleration$, rotationRate$, interval$, isSupported$ } = createDeviceMotion();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Acceleration X: {acceleration$.get().x}</p>
          <p>Rotation Alpha: {rotationRate$.get().alpha}</p>
          <p>Interval: {interval$.get()}ms</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createDeviceMotion } from "./core";
export type { UseDeviceMotionOptions, UseDeviceMotionReturn } from "./core";
export type UseDeviceMotion = typeof createDeviceMotion;
export declare const useDeviceMotion: UseDeviceMotion;
```

## Source

- Implementation: `packages/web/src/sensors/useDeviceMotion/index.ts`
- Documentation: `packages/web/src/sensors/useDeviceMotion/index.mdx`