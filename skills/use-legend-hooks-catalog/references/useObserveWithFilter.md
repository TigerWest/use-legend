# useObserveWithFilter

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect gated by an EventFilter. The selector always tracks dependencies on every change; only the effect execution is controlled by the filter.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { createPausableFilter, useObservable, useObserveWithFilter } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);
      const { pause, resume, eventFilter } = createPausableFilter();

      // ✅ Effect only fires when the filter allows it
      useObserveWithFilter(
        () => count$.get(),
        (value) => {
          console.log("count:", value);
        },
        { eventFilter }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPausableFilter, observable, observeWithFilter } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);
      const { pause, resume, eventFilter } = createPausableFilter();

      // ✅ Effect only fires when the filter allows it
      observeWithFilter(
        () => count$.get(),
        (value) => {
          console.log("count:", value);
        },
        { eventFilter }
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Pausable filter

Control when the effect fires by pausing and resuming the filter. The selector continues tracking changes in the background.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { createPausableFilter, useObservable, useObserveWithFilter } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);
      const { pause, resume, eventFilter } = createPausableFilter();

      useObserveWithFilter(
        () => count$.get(),
        (value) => {
          console.log("updated:", value);
        },
        { eventFilter }
      );

      // ✅ Pause the filter — changes to count$ won't trigger the effect
      pause();

      // ✅ Resume — the effect fires again on changes
      resume();
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPausableFilter, observable, observeWithFilter } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);
      const { pause, resume, eventFilter } = createPausableFilter();

      observeWithFilter(
        () => count$.get(),
        (value) => {
          console.log("updated:", value);
        },
        { eventFilter }
      );

      // ✅ Pause the filter — changes to count$ won't trigger the effect
      pause();

      // ✅ Resume — the effect fires again on changes
      resume();
    }
    ```

  </Fragment>
</CodeTabs>

### Debounce filter

Use a debounce filter to only execute the effect after the source stops changing for a specified duration.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { createDebounceFilter, useObservable, useObserveWithFilter } from "@usels/core";

    function Component() {
      const query$ = useObservable("");

      useObserveWithFilter(
        () => query$.get(),
        (value) => {
          console.log("search:", value);
        },
        { eventFilter: createDebounceFilter(300) }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDebounceFilter, observable, observeWithFilter } from "@usels/core";

    function Component() {
      "use scope"
      const query$ = observable("");

      observeWithFilter(
        () => query$.get(),
        (value) => {
          console.log("search:", value);
        },
        { eventFilter: createDebounceFilter(300) }
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
    import { createPausableFilter, useObservable, useObserveWithFilter } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);
      const { eventFilter } = createPausableFilter();

      // ✅ Also executes the effect immediately with the initial value
      useObserveWithFilter(
        () => count$.get(),
        (value) => {
          console.log("value:", value);
        },
        { eventFilter, immediate: true }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPausableFilter, observable, observeWithFilter } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);
      const { eventFilter } = createPausableFilter();

      // ✅ Also executes the effect immediately with the initial value
      observeWithFilter(
        () => count$.get(),
        (value) => {
          console.log("value:", value);
        },
        { eventFilter, immediate: true }
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
useObserveWithFilter(count$, (v) => console.log(v), { eventFilter, schedule: "sync" });
```

## Type Declarations

```typescript
export { observeWithFilter, type ObserveWithFilterOptions } from "./core";
export type UseObserveWithFilter = typeof observeWithFilter;
export declare const useObserveWithFilter: UseObserveWithFilter;
```

## Source

- Implementation: `packages/core/src/observe/useObserveWithFilter/index.ts`
- Documentation: `packages/core/src/observe/useObserveWithFilter/index.mdx`