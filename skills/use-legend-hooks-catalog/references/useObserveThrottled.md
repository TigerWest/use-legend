# useObserveThrottled

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect throttled — fires at most once per `ms` milliseconds. Built on `useObserveWithFilter`. The selector always tracks dependencies; only the effect is throttled.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useObservable, useObserveThrottled } from "@usels/core";

    function Component() {
      const position$ = useObservable({ x: 0, y: 0 });

      // ✅ Effect fires at most once every 100ms
      useObserveThrottled(
        () => position$.get(),
        (value) => {
          console.log("position:", value);
        },
        { ms: 100 }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observeThrottled } from "@usels/core";

    function Component() {
      "use scope"
      const position$ = observable({ x: 0, y: 0 });

      // ✅ Effect fires at most once every 100ms
      observeThrottled(
        () => position$.get(),
        (value) => {
          console.log("position:", value);
        },
        { ms: 100 }
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Leading and trailing edges

Control whether the effect fires at the leading edge (immediately on first change) or trailing edge (after the throttle window expires). By default, only the trailing edge fires.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObserveThrottled } from "@usels/core";

    function Component() {
      const mouseMove$ = useObservable({ x: 0, y: 0 });

      // ✅ Fire immediately on first change (leading), then at the end of each throttle window (trailing)
      useObserveThrottled(
        () => mouseMove$.get(),
        (value) => {
          console.log("mouse moved:", value);
        },
        { ms: 100, edges: ["leading", "trailing"] }
      );

      // ✅ Fire only on first change, skip throttled calls
      useObserveThrottled(
        () => mouseMove$.get(),
        (value) => {
          console.log("mouse started moving:", value);
        },
        { ms: 100, edges: ["leading"] }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observeThrottled } from "@usels/core";

    function Component() {
      "use scope"
      const mouseMove$ = observable({ x: 0, y: 0 });

      // ✅ Fire immediately on first change (leading), then at the end of each throttle window (trailing)
      observeThrottled(
        () => mouseMove$.get(),
        (value) => {
          console.log("mouse moved:", value);
        },
        { ms: 100, edges: ["leading", "trailing"] }
      );

      // ✅ Fire only on first change, skip throttled calls
      observeThrottled(
        () => mouseMove$.get(),
        (value) => {
          console.log("mouse started moving:", value);
        },
        { ms: 100, edges: ["leading"] }
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup, in addition to triggering on source changes.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObserveThrottled } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);

      // ✅ Also executes the effect immediately with the initial value
      useObserveThrottled(
        () => count$.get(),
        (value) => {
          console.log("value:", value);
        },
        { ms: 100, immediate: true }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observeThrottled } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);

      // ✅ Also executes the effect immediately with the initial value
      observeThrottled(
        () => count$.get(),
        (value) => {
          console.log("value:", value);
        },
        { ms: 100, immediate: true }
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Batch scheduling (`schedule`)

The `schedule` option controls when the effect runs relative to Legend-State's batch cycle.

- `schedule: 'sync'` — runs synchronously inside the batch (equivalent to Legend-State `immediate: true`)
- `schedule: 'deferred'` — runs after the batch ends (equivalent to Legend-State `immediate: false`)
- omitted — uses Legend-State's default batching

```typescript
useObserveThrottled(count$, (v) => console.log(v), { ms: 100, schedule: "sync" });
```

## Type Declarations

```typescript
export { observeThrottled, type ObserveThrottledOptions } from "./core";
export type UseObserveThrottled = typeof observeThrottled;
export declare const useObserveThrottled: UseObserveThrottled;
```

## Source

- Implementation: `packages/core/src/observe/useObserveThrottled/index.ts`
- Documentation: `packages/core/src/observe/useObserveThrottled/index.mdx`