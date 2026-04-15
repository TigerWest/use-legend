# useObserveTriggerable

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect with a manual `trigger()` method and an `ignoreUpdates` escape hatch.

## Usage

```tsx
import { observable, useObserveTriggerable } from "@usels/core";

const source$ = observable(0);

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
```

### Manual trigger

`trigger()` executes the effect immediately with the current selector value. Useful for initializing side effects on demand or re-running a sync after an ignored update.

```tsx
import { observable, useObserveTriggerable } from "@usels/core";

const remote$ = observable("");
const local$ = observable("");

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

### Breaking two-way binding cycles

The same `ignoreUpdates` pattern as `useObserveIgnorable` — prevents circular reactive updates when syncing two observables.

```tsx
import { observable, useObserveTriggerable, useWatch } from "@usels/core";

const local$ = observable("");
const remote$ = observable("");

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
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect on setup.

```tsx
import { observable, useObserveTriggerable } from "@usels/core";

const count$ = observable(0);

const { trigger } = useObserveTriggerable(
  () => count$.get(),
  (value) => {
    console.log("value:", value);
  },
  { immediate: true }
);
```

## Type Declarations

```typescript
export { observeTriggerable, type ObserveTriggerableReturn } from "./core";
export type UseObserveTriggerableOptions = WatchOptions;
export interface UseObserveTriggerableReturn {
    ignoreUpdates: (updater: () => void) => void;
    trigger: () => void;
}
export declare function useObserveTriggerable<T extends WatchSource>(selector: T, effect: Effector<T>, options?: UseObserveTriggerableOptions): UseObserveTriggerableReturn;
```

## Source

- Implementation: `packages/core/src/observe/useObserveTriggerable/index.ts`
- Documentation: `packages/core/src/observe/useObserveTriggerable/index.md`