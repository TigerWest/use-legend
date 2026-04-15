# useObserveIgnorable

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect with an `ignoreUpdates` escape hatch. Changes made inside `ignoreUpdates(updater)` do not trigger the effect. Useful for breaking circular update cycles in two-way bindings.

## Usage

```tsx
import { observable, useObserveIgnorable } from "@usels/core";

const source$ = observable(0);

const { ignoreUpdates, isIgnoring$ } = useObserveIgnorable(
  () => source$.get(),
  (value) => {
    console.log("source changed:", value);
  }
);

// Normal change — effect fires
source$.set(1);

// Ignored change — effect is suppressed
ignoreUpdates(() => {
  source$.set(2);
});
```

### Breaking two-way binding cycles

The primary use case is preventing a reactive feedback loop when syncing two observables.

```tsx
import { observable, useObserveIgnorable, useWatch } from "@usels/core";

const local$ = observable("");
const remote$ = observable("");

// Sync remote → local without triggering local → remote
const { ignoreUpdates } = useObserveIgnorable(
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
```

### Reactive `isIgnoring$`

`isIgnoring$` is an Observable that reflects whether an `ignoreUpdates` call is currently active.

```tsx
import { observable, Show, useObserveIgnorable } from "@usels/core";

const count$ = observable(0);

function MyComponent() {
  const { ignoreUpdates, isIgnoring$ } = useObserveIgnorable(
    () => count$.get(),
    (value) => {
      console.log("count:", value);
    }
  );

  return (
    <Show if={isIgnoring$}>
      <span>Ignoring updates...</span>
    </Show>
  );
}
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup.

```tsx
import { observable, useObserveIgnorable } from "@usels/core";

const count$ = observable(0);

const { ignoreUpdates } = useObserveIgnorable(
  () => count$.get(),
  (value) => {
    console.log("value:", value);
  },
  { immediate: true }
);
```

## Type Declarations

```typescript
export { observeIgnorable, type ObserveIgnorableReturn } from "./core";
export type UseObserveIgnorableOptions = WatchOptions;
export interface UseObserveIgnorableReturn {
    ignoreUpdates: (updater: () => void) => void;
    isIgnoring$: ReadonlyObservable<boolean>;
}
export declare function useObserveIgnorable<T extends WatchSource>(selector: T, effect: Effector<T>, options?: UseObserveIgnorableOptions): UseObserveIgnorableReturn;
```

## Source

- Implementation: `packages/core/src/observe/useObserveIgnorable/index.ts`
- Documentation: `packages/core/src/observe/useObserveIgnorable/index.md`