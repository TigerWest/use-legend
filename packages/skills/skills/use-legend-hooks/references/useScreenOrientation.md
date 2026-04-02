# useScreenOrientation

> Part of `@usels/web` | Category: Browser

## Overview

Reactive wrapper for the [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation). Tracks the current screen orientation type and angle, and provides methods to lock and unlock orientation.

## Usage

```tsx
import { useScreenOrientation } from "@usels/web";

const { isSupported$, orientation$, angle$, lockOrientation, unlockOrientation } =
  useScreenOrientation();

// Read current orientation
console.log(orientation$.get()); // e.g. 'portrait-primary'
console.log(angle$.get()); // e.g. 0

// Lock to landscape (requires user gesture / fullscreen)
await lockOrientation("landscape");

// Unlock
unlockOrientation();
```

## Type Declarations

```typescript
export type OrientationType = "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";
export type OrientationLockType = "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";
export type UseScreenOrientationOptions = ConfigurableWindow;
export interface UseScreenOrientationReturn extends Supportable {
    orientation$: ReadonlyObservable<OrientationType | undefined>;
    angle$: ReadonlyObservable<number>;
    lockOrientation: (type: OrientationLockType) => Promise<void>;
    unlockOrientation: () => void;
}
export declare function useScreenOrientation(options?: UseScreenOrientationOptions): UseScreenOrientationReturn;
```

## Source

- Implementation: `packages/web/src/browser/useScreenOrientation/index.ts`
- Documentation: `packages/web/src/browser/useScreenOrientation/index.md`