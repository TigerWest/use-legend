# useFps

> Part of `@usels/core` | Category: Timer

## Overview

Reactive frames-per-second counter using requestAnimationFrame

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useFps } from "@usels/core";

    function Component() {
      const fps = useFps();
      return <div>{fps.get()}</div>;
      // fps.get() → current FPS (0 until first sample)
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createFps } from "@usels/core";

    function Component() {
      "use scope"
      const { fps$ } = createFps();
      return <div>{fps$.get()}</div>;
      // fps$.get() → current FPS (0 until first sample)
    }
    ```

  </Fragment>
</CodeTabs>

### Custom sampling rate

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useFps } from "@usels/core";

    function Component() {
      const fps = useFps({ every: 20 }); // sample every 20 frames (~333ms at 60fps)
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createFps } from "@usels/core";

    function Component() {
      "use scope"
      const { fps$ } = createFps({ every: 20 }); // sample every 20 frames (~333ms at 60fps)
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createFps } from "./core";
export type { FpsOptions } from "./core";
export type UseFpsOptions = Pick<FpsOptions, "every">;
export declare function useFps(options?: DeepMaybeObservable<UseFpsOptions>): ReadonlyObservable<number>;
```

## Source

- Implementation: `packages/core/src/timer/useFps/index.ts`
- Documentation: `packages/core/src/timer/useFps/index.mdx`