# useDevicePixelRatio

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks `window.devicePixelRatio` using a `matchMedia` listener. Automatically updates when the display's pixel density changes (e.g., moving a window between monitors with different DPI, or browser zoom level changes).

## Usage

```tsx
import { useDevicePixelRatio } from "@usels/web";

function PixelRatioDisplay() {
  const { isSupported$, pixelRatio$ } = useDevicePixelRatio();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Pixel Ratio: {pixelRatio$.get()}</p>
    </div>
  );
}
```

## Type Declarations

```typescript
export type UseDevicePixelRatioOptions = ConfigurableWindow;
export interface UseDevicePixelRatioReturn extends Supportable {
    pixelRatio$: ReadonlyObservable<number>;
}
export declare function useDevicePixelRatio(options?: UseDevicePixelRatioOptions): UseDevicePixelRatioReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useDevicePixelRatio/index.ts`
- Documentation: `packages/web/src/sensors/useDevicePixelRatio/index.md`