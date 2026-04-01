---
title: useObserveWithFilter
category: Observe
sidebar:
  order: 3
---

Runs a reactive effect gated by an EventFilter. The selector always tracks dependencies on every change; only the effect execution is controlled by the filter.

## Usage

```tsx twoslash
// @noErrors
import { useObserveWithFilter, createPausableFilter } from "@usels/core";
import { observable } from "@legendapp/state";

const count$ = observable(0);
const { pause, resume, eventFilter } = createPausableFilter();

// ✅ Effect only fires when the filter allows it
useObserveWithFilter(
  () => count$.get(),
  (value) => {
    console.log("count:", value);
  },
  { eventFilter }
);
```

### Pausable filter

Control when the effect fires by pausing and resuming the filter. The selector continues tracking changes in the background.

```tsx twoslash
// @noErrors
import { useObserveWithFilter, createPausableFilter } from "@usels/core";
import { observable } from "@legendapp/state";

const count$ = observable(0);
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
```

### Debounce filter

Use a debounce filter to only execute the effect after the source stops changing for a specified duration.

```tsx twoslash
// @noErrors
import { useObserveWithFilter, createDebounceFilter } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");

useObserveWithFilter(
  () => query$.get(),
  (value) => {
    console.log("search:", value);
  },
  { eventFilter: createDebounceFilter(300) }
);
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup, in addition to triggering on source changes.

```tsx twoslash
// @noErrors
import { useObserveWithFilter, createPausableFilter } from "@usels/core";
import { observable } from "@legendapp/state";

const count$ = observable(0);
const { eventFilter } = createPausableFilter();

// ✅ Also executes the effect immediately with the initial value
useObserveWithFilter(
  () => count$.get(),
  (value) => {
    console.log("value:", value);
  },
  { eventFilter, immediate: true }
);
```

### Batch scheduling (`schedule`)

The `schedule` option controls when the effect runs relative to Legend-State's batch cycle.

- `schedule: 'sync'` — runs synchronously inside the batch (equivalent to Legend-State `immediate: true`)
- `schedule: 'deferred'` — runs after the batch ends (equivalent to Legend-State `immediate: false`)
- omitted — uses Legend-State's default batching

```typescript
useObserveWithFilter(count$, (v) => console.log(v), { eventFilter, schedule: "sync" });
```
