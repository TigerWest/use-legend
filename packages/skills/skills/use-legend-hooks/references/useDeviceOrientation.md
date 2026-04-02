# useDeviceOrientation

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks the physical orientation of the device using the `deviceorientation` window event, exposing reactive observables for all orientation angles.

## Usage

```tsx
import { useDeviceOrientation } from "@usels/web";

const { isSupported$, isAbsolute$, alpha$, beta$, gamma$ } = useDeviceOrientation();

// alpha: rotation around z-axis (0–360)
// beta:  rotation around x-axis (-180–180)
// gamma: rotation around y-axis (-90–90)
console.log(alpha$.get(), beta$.get(), gamma$.get());
```

## Type Declarations

```typescript
export type UseDeviceOrientationOptions = ConfigurableWindow;
export interface UseDeviceOrientationReturn extends Supportable, PermissionAware {
    hasRealData$: ReadonlyObservable<boolean>;
    isAbsolute$: ReadonlyObservable<boolean>;
    alpha$: ReadonlyObservable<number | null>;
    beta$: ReadonlyObservable<number | null>;
    gamma$: ReadonlyObservable<number | null>;
}
export declare function useDeviceOrientation(options?: UseDeviceOrientationOptions): UseDeviceOrientationReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useDeviceOrientation/index.ts`
- Documentation: `packages/web/src/sensors/useDeviceOrientation/index.md`