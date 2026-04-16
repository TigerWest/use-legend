# useThrottleFn

> Part of `@usels/core` | Category: Utilities

## Overview

Throttle execution of a function. Especially useful for rate limiting execution of handlers on events like resize and scroll.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useThrottleFn } from "@usels/core";

    function Component() {
      const throttledFn = useThrottleFn((value: string) => {
        console.log(value);
      }, 250);
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottleFn } from "@usels/core";

    function Component() {
      "use scope"
      const { throttledFn } = createThrottleFn((value: string) => {
        console.log(value);
      }, 250);
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive interval

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useThrottleFn } from "@usels/core";

    function Component() {
      const delay$ = useObservable(300);
      const throttledFn = useThrottleFn(() => {
        // ...
      }, delay$);
      // Changing delay$ applies the new interval from the next call
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottleFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const delay$ = observable(300);
      const { throttledFn } = createThrottleFn(() => {
        // ...
      }, delay$);
    }
    ```

  </Fragment>
</CodeTabs>

### Leading edge only

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useThrottleFn } from "@usels/core";

    function Component() {
      // Fires immediately on first call, suppresses all subsequent calls within interval
      const throttledFn = useThrottleFn(
        () => { /* ... */ },
        300,
        { edges: ["leading"] }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottleFn } from "@usels/core";

    function Component() {
      "use scope"
      const { throttledFn } = createThrottleFn(
        () => { /* ... */ },
        300,
        { edges: ["leading"] }
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Trailing edge only

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useThrottleFn } from "@usels/core";

    function Component() {
      // Does not fire immediately — fires once after the interval ends
      const throttledFn = useThrottleFn(
        () => { /* ... */ },
        300,
        { edges: ["trailing"] }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottleFn } from "@usels/core";

    function Component() {
      "use scope"
      const { throttledFn } = createThrottleFn(
        () => { /* ... */ },
        300,
        { edges: ["trailing"] }
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createThrottleFn } from "./core";
export declare function useThrottleFn<T extends AnyFn>(fn: T, ms?: MaybeObservable<number>, options?: ThrottleFilterOptions): PromisifyFn<T>;
```

## Source

- Implementation: `packages/core/src/utilities/useThrottleFn/index.ts`
- Documentation: `packages/core/src/utilities/useThrottleFn/index.mdx`