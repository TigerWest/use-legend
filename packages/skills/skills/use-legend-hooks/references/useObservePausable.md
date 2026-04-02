# useObservePausable

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect with built-in pause/resume controls. Built on `useObserveWithFilter`. The selector always tracks dependencies; only the effect execution is gated by the active state.

## Usage

```tsx
import { useObservePausable } from "@usels/core";
import { observable } from "@legendapp/state";

const count$ = observable(0);

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
```

### Start paused

Use `initialState: 'paused'` to start with the effect suppressed. Call `resume()` whenever you're ready to begin reacting.

```tsx
import { useObservePausable } from "@usels/core";
import { observable } from "@legendapp/state";

const data$ = observable(0);

const { resume } = useObservePausable(
  () => data$.get(),
  (value) => {
    console.log("data:", value);
  },
  { initialState: "paused" }
);

// Start reacting when ready
resume();
```

### Reactive `isActive$`

`isActive$` is an Observable — use it directly in JSX for reactive UI.

```tsx
import { useObservePausable } from "@usels/core";
import { observable } from "@legendapp/state";
import { Show } from "@legendapp/state/react";

const count$ = observable(0);

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

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup.

```tsx
import { useObservePausable } from "@usels/core";
import { observable } from "@legendapp/state";

const count$ = observable(0);

useObservePausable(
  () => count$.get(),
  (value) => {
    console.log("value:", value);
  },
  { immediate: true }
);
```

## Type Declarations

```typescript
export { observePausable, type ObservePausableOptions } from "./core";
export type UseObservePausableOptions = ObservePausableOptions;
export declare function useObservePausable<T extends WatchSource>(selector: T, effect: Effector<T>, options?: UseObservePausableOptions): Pausable;
```

## Source

- Implementation: `packages/core/src/observe/useObservePausable/index.ts`
- Documentation: `packages/core/src/observe/useObservePausable/index.md`