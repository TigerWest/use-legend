# useRafFn

> Part of `@usels/core` | Category: Timer

## Overview

Call a function on every requestAnimationFrame with pause/resume control

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRafFn } from "@usels/core";

    function Component() {
      const { isActive, pause, resume } = useRafFn(({ delta, timestamp }) => {
        // called ~60 times/sec
        console.log(`delta: ${delta}ms`);
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRafFn } from "@usels/core";

    function Component() {
      "use scope"
      const { isActive$, pause, resume } = createRafFn(({ delta, timestamp }) => {
        // called ~60 times/sec
        console.log(`delta: ${delta}ms`);
      });
    }
    ```

  </Fragment>
</CodeTabs>

### FPS limit

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { observable, useRafFn } from "@usels/core";

    function Component() {
      const fps$ = observable(30);
      useRafFn(({ delta }) => {}, { fpsLimit: fps$ });
      // caps execution to 30fps; fps$.set(60) applies next frame
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRafFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const fps$ = observable(30);
      createRafFn(({ delta }) => {}, { fpsLimit: fps$ });
      // caps execution to 30fps; fps$.set(60) applies next frame
    }
    ```

  </Fragment>
</CodeTabs>

### Run once

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRafFn } from "@usels/core";

    function Component() {
      useRafFn(
        ({ timestamp }) => {
          console.log("ran once at", timestamp);
        },
        { once: true }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRafFn } from "@usels/core";

    function Component() {
      "use scope"
      createRafFn(
        ({ timestamp }) => {
          console.log("ran once at", timestamp);
        },
        { once: true }
      );
    }
    ```

  </Fragment>
</CodeTabs>

> **Note:** `once: true` means "pause after the first frame **per resume cycle**". Calling `resume()` again starts a new cycle.

## Type Declarations

```typescript
export { createRafFn } from "./core";
export type { RafFnCallbackArguments, RafFnOptions } from "./core";
export type UseRafFnCallbackArguments = RafFnCallbackArguments;
export type UseRafFnOptions = RafFnOptions;
export type UseRafFn = (fn: (args: RafFnCallbackArguments) => void, options?: RafFnOptions) => Pausable;
export declare const useRafFn: UseRafFn;
```

## Source

- Implementation: `packages/core/src/timer/useRafFn/index.ts`
- Documentation: `packages/core/src/timer/useRafFn/index.mdx`