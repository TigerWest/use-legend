# useDeviceOrientation

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks the physical orientation of the device using the `deviceorientation` window event, exposing reactive observables for all orientation angles.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useDeviceOrientation } from "@usels/web";

    function MyComponent() {
      const { isSupported$, isAbsolute$, alpha$, beta$, gamma$ } = useDeviceOrientation();

      return (
        <div>
          <p>Alpha: {alpha$.get()}</p>
          <p>Beta: {beta$.get()}</p>
          <p>Gamma: {gamma$.get()}</p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDeviceOrientation } from "@usels/web";

    function MyComponent() {
      "use scope"
      const { isSupported$, isAbsolute$, alpha$, beta$, gamma$ } = createDeviceOrientation();

      return (
        <div>
          <p>Alpha: {alpha$.get()}</p>
          <p>Beta: {beta$.get()}</p>
          <p>Gamma: {gamma$.get()}</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createDeviceOrientation } from "./core";
export type { UseDeviceOrientationOptions, UseDeviceOrientationReturn } from "./core";
export type UseDeviceOrientation = typeof createDeviceOrientation;
export declare const useDeviceOrientation: UseDeviceOrientation;
```

## Source

- Implementation: `packages/web/src/sensors/useDeviceOrientation/index.ts`
- Documentation: `packages/web/src/sensors/useDeviceOrientation/index.mdx`