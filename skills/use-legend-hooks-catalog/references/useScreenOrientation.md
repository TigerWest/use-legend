# useScreenOrientation

> Part of `@usels/web` | Category: Browser

## Overview

Reactive wrapper for the [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation). Tracks the current screen orientation type and angle, and provides methods to lock and unlock orientation.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useScreenOrientation } from "@usels/web";

    function Component() {
      const { isSupported$, orientation$, angle$, lockOrientation, unlockOrientation } =
        useScreenOrientation();

      return (
        <div>
          <p>Type: {orientation$.get()}</p>
          <p>Angle: {angle$.get()}</p>
          <button onClick={() => lockOrientation("landscape")}>Lock landscape</button>
          <button onClick={() => unlockOrientation()}>Unlock</button>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createScreenOrientation } from "@usels/web";

    function Component() {
      "use scope"
      const { isSupported$, orientation$, angle$, lockOrientation, unlockOrientation } =
        createScreenOrientation();

      return (
        <div>
          <p>Type: {orientation$.get()}</p>
          <p>Angle: {angle$.get()}</p>
          <button onClick={() => lockOrientation("landscape")}>Lock landscape</button>
          <button onClick={() => unlockOrientation()}>Unlock</button>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createScreenOrientation } from "./core";
export type { OrientationType, OrientationLockType, UseScreenOrientationOptions, UseScreenOrientationReturn, } from "./core";
export type UseScreenOrientation = typeof createScreenOrientation;
export declare const useScreenOrientation: UseScreenOrientation;
```

## Source

- Implementation: `packages/web/src/browser/useScreenOrientation/index.ts`
- Documentation: `packages/web/src/browser/useScreenOrientation/index.mdx`