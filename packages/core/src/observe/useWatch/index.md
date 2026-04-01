---
title: useWatch
category: Observe
sidebar:
  order: 0
---

Runs a reactive effect that skips the initial run on mount by default (lazy mode).
Pass `immediate: true` to also fire on mount (eager mode).
The selector always tracks dependencies; the effect is suppressed on the first call unless `immediate: true`.

Selector supports three forms:

- **Single observable** — `useWatch(count$, (v) => ...)`
- **Array of observables** — `useWatch([a$, b$], ([a, b]) => ...)`, like `watch([ref1, ref2], ...)`
- **Reactive function** — `useWatch(() => count$.get(), (v) => ...)`

## Usage

```tsx twoslash
// @noErrors
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");

// ✅ Lazy (default) — runs only when query$ changes after mount
useWatch(query$, (value) => {
  console.log("search:", value);
});
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to also fire the effect on mount, in addition to subsequent changes.

```tsx twoslash
// @noErrors
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");

// ✅ Also fires on mount with the initial value
useWatch(
  query$,
  (value) => {
    console.log("value:", value);
  },
  { immediate: true }
);
```

### Array of observables

Watch multiple sources at once. The effect receives a tuple of current values.

```tsx twoslash
// @noErrors
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");
const page$ = observable(1);

useWatch([query$, page$], ([query, page]) => {
  console.log("fetch page", page, "for query:", query);
});
```

### Reactive function selector

Use a function to compute a derived value. The function runs on every dep change to maintain tracking; the effect receives the computed result.

```tsx twoslash
// @noErrors
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const firstName$ = observable("John");
const lastName$ = observable("Doe");

useWatch(
  () => `${firstName$.get()} ${lastName$.get()}`,
  (fullName) => {
    console.log("name changed:", fullName);
  }
);
```

### Batch timing (`flush`)

The `flush` option controls when the effect runs relative to Legend-State's batch cycle.

- `flush: 'pre'` — runs synchronously (within the same batch), equivalent to passing `{ immediate: true }` to Legend-State's `observe()`
- `flush: 'post'` — runs after the batch (default Legend-State behavior)
- omitted — uses Legend-State's default (no `immediate` option passed)

```typescript
useWatch(count$, (v) => console.log(v), { flush: "pre" });
```
