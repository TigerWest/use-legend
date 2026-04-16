# useObserveTriggerable

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect with a manual `trigger()` method and an `ignoreUpdates` escape hatch.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useObservable, useObserveTriggerable } from "@usels/core";

    function Component() {
      const source$ = useObservable(0);

      const { trigger, ignoreUpdates } = useObserveTriggerable(
        () => source$.get(),
        (value) => {
          console.log("source:", value);
        }
      );

      // Reactive: effect fires when source$ changes
      source$.set(1);

      // Manual: effect runs immediately with the current value
      trigger();

      // Ignored: effect is suppressed for this update
      ignoreUpdates(() => {
        source$.set(2);
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observeTriggerable } from "@usels/core";

    function Component() {
      "use scope"
      const source$ = observable(0);

      const { trigger, ignoreUpdates } = observeTriggerable(
        () => source$.get(),
        (value) => {
          console.log("source:", value);
        }
      );

      // Reactive: effect fires when source$ changes
      source$.set(1);

      // Manual: effect runs immediately with the current value
      trigger();

      // Ignored: effect is suppressed for this update
      ignoreUpdates(() => {
        source$.set(2);
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Manual trigger

`trigger()` executes the effect immediately with the current selector value. Useful for initializing side effects on demand or re-running a sync after an ignored update.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObserveTriggerable } from "@usels/core";

    const remote$ = useObservable("");
    const local$ = useObservable("");

    function MyComponent() {
      const { trigger, ignoreUpdates } = useObserveTriggerable(
        () => remote$.get(),
        (remoteValue) => {
          ignoreUpdates(() => {
            local$.set(remoteValue);
          });
        }
      );

      // Force a sync of remote → local on demand
      return <button onClick={trigger}>Sync now</button>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observeTriggerable } from "@usels/core";

    const remote$ = observable("");
    const local$ = observable("");

    function MyComponent() {
      "use scope"
      const { trigger, ignoreUpdates } = observeTriggerable(
        () => remote$.get(),
        (remoteValue) => {
          ignoreUpdates(() => {
            local$.set(remoteValue);
          });
        }
      );

      // Force a sync of remote → local on demand
      return <button onClick={trigger}>Sync now</button>;
    }
    ```

  </Fragment>
</CodeTabs>

### Breaking two-way binding cycles

The same `ignoreUpdates` pattern as `useObserveIgnorable` — prevents circular reactive updates when syncing two observables.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObserveTriggerable, useWatch } from "@usels/core";

    function Component() {
      const local$ = useObservable("");
      const remote$ = useObservable("");

      // Sync remote → local without triggering local → remote
      const { ignoreUpdates } = useObserveTriggerable(
        () => remote$.get(),
        (remoteValue) => {
          ignoreUpdates(() => {
            local$.set(remoteValue);
          });
        }
      );

      // Sync local → remote
      useWatch(
        () => local$.get(),
        (localValue) => {
          remote$.set(localValue);
        }
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, observeTriggerable, watch } from "@usels/core";

    function Component() {
      "use scope"
      const local$ = observable("");
      const remote$ = observable("");

      // Sync remote → local without triggering local → remote
      const { ignoreUpdates } = observeTriggerable(
        () => remote$.get(),
        (remoteValue) => {
          ignoreUpdates(() => {
            local$.set(remoteValue);
          });
        }
      );

      // Sync local → remote
      watch(
        () => local$.get(),
        (localValue) => {
          remote$.set(localValue);
        }
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect on setup.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useObserveTriggerable } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);

      const { trigger } = useObserveTriggerable(
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
    import { observable, observeTriggerable } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);

      const { trigger } = observeTriggerable(
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
export { observeTriggerable, type ObserveTriggerableReturn } from "./core";
export type UseObserveTriggerable = typeof observeTriggerable;
export declare const useObserveTriggerable: UseObserveTriggerable;
```

## Source

- Implementation: `packages/core/src/observe/useObserveTriggerable/index.ts`
- Documentation: `packages/core/src/observe/useObserveTriggerable/index.mdx`