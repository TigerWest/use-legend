# useIntervalFn

> Part of `@usels/core` | Category: Timer

## Overview

Reactive setInterval wrapper with pause/resume control

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useIntervalFn } from "@usels/core";

    function Component() {
      const { isActive, pause, resume } = useIntervalFn(() => {
        console.log("tick");
      }, 1000);

      // isActive.get() === true while running
      // pause() / resume() to control execution
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createIntervalFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const { isActive$, pause, resume } = createIntervalFn(() => {
        console.log("tick");
      }, observable(1000));

      // isActive$.get() === true while running
      // pause() / resume() to control execution
    }
    ```

  </Fragment>
</CodeTabs>

### `immediateCallback`

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useIntervalFn } from "@usels/core";

    function Component() {
      useIntervalFn(() => fetchData(), 5000, { immediateCallback: true });
      // calls fetchData() immediately on resume, then every 5s
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createIntervalFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      createIntervalFn(() => fetchData(), observable(5000), { immediateCallback: true });
      // calls fetchData() immediately on resume, then every 5s
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive interval

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { observable, useIntervalFn } from "@usels/core";

    function Component() {
      const ms$ = observable(1000);
      useIntervalFn(() => {}, ms$);
      // ms$.set(500) → automatically restarts with new interval
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createIntervalFn, observable } from "@usels/core";

    function Component() {
      "use scope"
      const ms$ = observable(1000);
      createIntervalFn(() => {}, ms$);
      // ms$.set(500) → automatically restarts with new interval
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createIntervalFn } from "./core";
export type { IntervalFnOptions } from "./core";
export type UseIntervalFn = (cb: AnyFn, interval?: MaybeObservable<number>, options?: IntervalFnOptions) => Pausable;
export declare const useIntervalFn: UseIntervalFn;
```

## Source

- Implementation: `packages/core/src/timer/useIntervalFn/index.ts`
- Documentation: `packages/core/src/timer/useIntervalFn/index.mdx`