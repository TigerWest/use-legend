# useObservePausable

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect with built-in pause/resume controls. Built on `useObserveWithFilter`. The selector always tracks dependencies; only the effect execution is gated by the active state.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useObservable, useObservePausable } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);

      const { isActive$, pause, resume } = useObservePausable(
        () => count$.get(),
        (value) => {
          console.log("count:", value);
        }
      );

      // Pause — changes to count$ won't trigger the effect
      pause();

      // Resume — effect fires again on changes
      resume();
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observePausable } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);

      const { isActive$, pause, resume } = observePausable(
        () => count$.get(),
        (value) => {
          console.log("count:", value);
        }
      );

      // Pause — changes to count$ won't trigger the effect
      pause();

      // Resume — effect fires again on changes
      resume();
    }
    ```

  </Fragment>
</CodeTabs>

### Start paused

Use `initialState: 'paused'` to start with the effect suppressed. Call `resume()` whenever you're ready to begin reacting.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObservePausable } from "@usels/core";

    function Component() {
      const data$ = useObservable(0);

      const { resume } = useObservePausable(
        () => data$.get(),
        (value) => {
          console.log("data:", value);
        },
        { initialState: "paused" }
      );

      // Start reacting when ready
      resume();
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observePausable } from "@usels/core";

    function Component() {
      "use scope"
      const data$ = observable(0);

      const { resume } = observePausable(
        () => data$.get(),
        (value) => {
          console.log("data:", value);
        },
        { initialState: "paused" }
      );

      // Start reacting when ready
      resume();
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive `isActive$`

`isActive$` is an Observable — use it directly in JSX for reactive UI.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { observable, Show, useObservePausable } from "@usels/core";

    const count$ = useObservable(0);

    function MyComponent() {
      const { isActive$, pause, resume } = useObservePausable(
        () => count$.get(),
        (value) => {
          console.log("count:", value);
        }
      );

      return (
        <Show if={isActive$} else={<button onClick={resume}>Resume</button>}>
          <button onClick={pause}>Pause</button>
        </Show>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observePausable, Show } from "@usels/core";

    const count$ = observable(0);

    function MyComponent() {
      "use scope"
      const { isActive$, pause, resume } = observePausable(
        () => count$.get(),
        (value) => {
          console.log("count:", value);
        }
      );

      return (
        <Show if={isActive$} else={<button onClick={resume}>Resume</button>}>
          <button onClick={pause}>Pause</button>
        </Show>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObservePausable } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);

      useObservePausable(
        () => count$.get(),
        (value) => {
          console.log("value:", value);
        },
        { immediate: true }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observePausable } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);

      observePausable(
        () => count$.get(),
        (value) => {
          console.log("value:", value);
        },
        { immediate: true }
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { observePausable, type ObservePausableOptions } from "./core";
export type UseObservePausable = typeof observePausable;
export declare const useObservePausable: UseObservePausable;
```

## Source

- Implementation: `packages/core/src/observe/useObservePausable/index.ts`
- Documentation: `packages/core/src/observe/useObservePausable/index.mdx`