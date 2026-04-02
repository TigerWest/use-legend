---
title: useObserveDebounced
category: Observe
sidebar:
  order: 1
---

Runs a reactive effect debounced — fires only after `ms` milliseconds of inactivity. Built on `useObserveWithFilter`. The selector always tracks dependencies; only the effect is debounced.

## Usage

```tsx twoslash
// @noErrors
import { useObserveDebounced } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");

// ✅ Effect fires only after query$ stops changing for 300ms
useObserveDebounced(
  () => query$.get(),
  (value) => {
    console.log("search:", value);
  },
  { ms: 300 }
);
```

### With maxWait

Use `maxWait` to guarantee the effect fires at least once, even if the source keeps changing continuously. The effect will fire after `maxWait` milliseconds regardless of activity.

```tsx
// @noErrors
import { useObserveDebounced } from "@usels/core";
import { observable } from "@legendapp/state";

const input$ = observable("");

useObserveDebounced(
  () => input$.get(),
  (value) => {
    console.log("submit:", value);
  },
  { ms: 300, maxWait: 1000 }
);
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup, in addition to triggering on source changes.

```tsx
// @noErrors
import { useObserveDebounced } from "@usels/core";
import { observable } from "@legendapp/state";

const count$ = observable(0);

// ✅ Also executes the effect immediately with the initial value
useObserveDebounced(
  () => count$.get(),
  (value) => {
    console.log("value:", value);
  },
  { ms: 300, immediate: true }
);
```

### Batch scheduling (`schedule`)

The `schedule` option controls when the effect runs relative to Legend-State's batch cycle.

- `schedule: 'sync'` — runs synchronously inside the batch (equivalent to Legend-State `immediate: true`)
- `schedule: 'deferred'` — runs after the batch ends (equivalent to Legend-State `immediate: false`)
- omitted — uses Legend-State's default batching

```typescript
useObserveDebounced(count$, (v) => console.log(v), { ms: 300, schedule: "sync" });
```
