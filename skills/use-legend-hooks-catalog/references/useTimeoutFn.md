# useTimeoutFn

> Part of `@usels/core` | Category: Timer

## Overview

Reactive wrapper for setTimeout with start/stop control

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useTimeoutFn } from "@usels/core";

    function Component() {
      const { isPending$, start, stop } = useTimeoutFn(() => {
        console.log("fired!");
      }, 1000);

      // isPending$.get() === true while waiting
      // stop() cancels the pending timeout
      // start() restarts the timer (resets if already pending)
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeoutFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const { isPending$, start, stop } = createTimeoutFn(() => {
        console.log("fired!");
      }, observable(1000));

      // isPending$.get() === true while waiting
      // stop() cancels the pending timeout
      // start() restarts the timer (resets if already pending)
    }
    ```

  </Fragment>
</CodeTabs>

### Manual start (`immediate: false`)

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeoutFn } from "@usels/core";

    function Component() {
      const { isPending$, start } = useTimeoutFn(() => console.log("done"), 500, {
        immediate: false,
      });

      // call start() manually when ready
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeoutFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const { isPending$, start } = createTimeoutFn(() => console.log("done"), observable(500), {
        immediate: false,
      });

      // call start() manually when ready
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive interval (`MaybeObservable`)

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { observable, useTimeoutFn } from "@usels/core";

    function Component() {
      const delay$ = observable(1000);
      const { start } = useTimeoutFn(() => {}, delay$);
      // start() always reads current value of delay$
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeoutFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const delay$ = observable(1000);
      const { start } = createTimeoutFn(() => {}, delay$);
      // start() always reads current value of delay$
    }
    ```

  </Fragment>
</CodeTabs>

### `immediateCallback`

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeoutFn } from "@usels/core";

    function Component() {
      const { start } = useTimeoutFn((msg?: string) => console.log("fired", msg), 1000, {
        immediate: false,
        immediateCallback: true,
      });

      start("hello");
      // → cb() called immediately with no args
      // → cb("hello") called again after 1000ms
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeoutFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const { start } = createTimeoutFn((msg?: string) => console.log("fired", msg), observable(1000), {
        immediate: false,
        immediateCallback: true,
      });

      start("hello");
      // → cb() called immediately with no args
      // → cb("hello") called again after 1000ms
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createTimeoutFn } from "./core";
export type { TimeoutFnOptions } from "./core";
export type UseTimeoutFn = typeof createTimeoutFn;
export declare const useTimeoutFn: UseTimeoutFn;
```

## Source

- Implementation: `packages/core/src/timer/useTimeoutFn/index.ts`
- Documentation: `packages/core/src/timer/useTimeoutFn/index.mdx`