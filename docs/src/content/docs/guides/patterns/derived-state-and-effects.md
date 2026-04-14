---
title: Derived State & Effects
description: Choose derived observables, observe, watch, and whenever based on whether you need a value or a side effect.
---

Use derived observables when you need another value. Use effects when you need to
do work because a value changed.

## Derived Values

Use `observable(() => ...)` for values that can be computed from other
observables:

```tsx
const cart$ = observable<Record<string, number>>({});

const cartCount$ = observable(() =>
  Object.values(cart$.get()).reduce((total, quantity) => total + quantity, 0)
);
```

This keeps derived state declarative and removes extra synchronization code.

## Effects

Use the smallest effect API that matches the behavior:

| Need | API |
| --- | --- |
| Track any reads inside an effect | `observe()` or `useObserve()` |
| Watch a specific source and skip the first run | `watch()` or `useWatch()` |
| Run only when a value becomes truthy | `whenever()` or `useWhenever()` |
| Debounce or throttle effect scheduling | `useObserveDebounced()`, `useObserveThrottled()` |

## Watch Example

```tsx
import { observable, watch } from "@usels/core";

function SearchSync() {
  "use scope";

  const query$ = observable("");

  watch(query$, (query) => {
    console.log("query changed:", query);
  });

  return <input value={query$.get()} onChange={(event) => query$.set(event.currentTarget.value)} />;
}
```

## Avoid Mirroring Derived State With Effects

If a value can be derived, derive it:

```tsx
const fullName$ = observable(() => `${firstName$.get()} ${lastName$.get()}`);
```

Use an effect for external work such as DOM sync, analytics, storage, network
requests, or calls into another store.
