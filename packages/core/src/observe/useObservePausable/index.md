---
title: useObservePausable
category: Observe
---

Runs a reactive effect with built-in pause/resume controls. Built on `useObserveWithFilter`. The selector always tracks dependencies; only the effect execution is gated by the active state.

## Demo

## Usage

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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
