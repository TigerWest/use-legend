# useDevicePixelRatio

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks `window.devicePixelRatio` using a `matchMedia` listener. Automatically updates when the display's pixel density changes (e.g., moving a window between monitors with different DPI, or browser zoom level changes).

## Usage

<CodeTabs>
  <Fragment slot="hook">
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDevicePixelRatio } from "@usels/web";

    function PixelRatioDisplay() {
      "use scope";
      const { isSupported$, pixelRatio$ } = createDevicePixelRatio();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Pixel Ratio: {pixelRatio$.get()}</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createDevicePixelRatio } from "./core";
export type { UseDevicePixelRatioOptions, UseDevicePixelRatioReturn } from "./core";
export type UseDevicePixelRatio = typeof createDevicePixelRatio;
export declare const useDevicePixelRatio: UseDevicePixelRatio;
```

## Source

- Implementation: `packages/web/src/sensors/useDevicePixelRatio/index.ts`
- Documentation: `packages/web/src/sensors/useDevicePixelRatio/index.mdx`