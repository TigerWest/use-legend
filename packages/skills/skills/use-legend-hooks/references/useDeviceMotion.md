# useDeviceMotion

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent). Provides reactive access to device acceleration and rotation rate data.

## Usage

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

## Type Declarations

```typescript
export type UseDeviceMotionOptions = ConfigurableWindow;
export interface UseDeviceMotionReturn extends Supportable, PermissionAware {
    hasRealData$: ReadonlyObservable<boolean>;
    acceleration$: ReadonlyObservable<{
        x: number | null;
        y: number | null;
        z: number | null;
    }>;
    accelerationIncludingGravity$: ReadonlyObservable<{
        x: number | null;
        y: number | null;
        z: number | null;
    }>;
    rotationRate$: ReadonlyObservable<{
        alpha: number | null;
        beta: number | null;
        gamma: number | null;
    }>;
    interval$: ReadonlyObservable<number>;
}
export declare function useDeviceMotion(options?: UseDeviceMotionOptions): UseDeviceMotionReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useDeviceMotion/index.ts`
- Documentation: `packages/web/src/sensors/useDeviceMotion/index.md`