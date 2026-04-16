---
title: Derived State & Effects
description: Choose derived observables, useObserve, useWatch, and useWhenever based on whether you need a value or a side effect.
---

Use derived observables when you need another value. Use effects when you need to do work because a value changed.

## Derived Values

Use `useObservable(() => ...)` for values that can be computed from other observables:

```tsx
import { useObservable } from "@legendapp/state/react";

function CartBadge() {
  const cart$ = useObservable<Record<string, number>>({});
  const cartCount$ = useObservable(() =>
    Object.values(cart$.get()).reduce((total, quantity) => total + quantity, 0)
  );

  return <span>{cartCount$.get()} items</span>;
}
```

This keeps derived state declarative and removes extra synchronization code.

## Effects

Three hook flavors cover the common effect shapes:

- `useObserve(fn)` — runs immediately and re-runs whenever any observable read inside it changes.
- `useWatch(selector, effect, opts?)` — reacts to a specific source. Skips the initial value by default (`immediate: true` to include it).
- `useWhenever(selector, effect, opts?)` — fires when the selector becomes truthy (`{ once: true }` to self-dispose after the first fire).

## Watch Example

```tsx
import { useObservable } from "@legendapp/state/react";
import { useWatch } from "@usels/core";

function SearchSync() {
  const query$ = useObservable("");

  useWatch(query$, (query) => {
    console.log("query changed:", query);
  });

  return <input value={query$.get()} onChange={(event) => query$.set(event.currentTarget.value)} />;
}
```

## Avoid Mirroring Derived State With Effects

If a value can be derived, derive it:

```tsx
const fullName$ = useObservable(() => `${firstName$.get()} ${lastName$.get()}`);
```

Use an effect for external work such as DOM sync, analytics, storage, network requests, or calls into another store.

## Avoid Early Return With `.get()`

Observable reads outside JSX or outside a reactive context are plain snapshots. An early return based on `.get()` does not re-run the component when the value changes:

```tsx
// ❌ Early return — the component won't re-render when error$ changes
if (error$.get()) return <p>Error</p>;
if (!isLoaded$.get()) return <p>Loading...</p>;
return <div>{data$.name.get()}</div>;
```

Instead, keep everything inside a single return and use ternary expressions. The Babel plugin tracks each `.get()` call inline in JSX:

```tsx
// ✅ Ternary — each .get() is a fine-grained leaf
return error$.get()
  ? <p>Error: {error$.get()?.message}</p>
  : !isLoaded$.get()
    ? <p>Loading...</p>
    : <div>{data$.name.get()}</div>;
```

Or derive a view-state observable that captures the branching logic:

```tsx
const view$ = useObservable(() => {
  if (error$.get()) return "error" as const;
  if (!isLoaded$.get()) return "loading" as const;
  return "ready" as const;
});

return view$.get() === "error"
  ? <p>Error</p>
  : view$.get() === "loading"
    ? <p>Loading...</p>
    : <div>{data$.name.get()}</div>;
```

## Related

- [Observable-First Mental Model](/use-legend/guides/observable-first-mental-model/) — why derived observables beat mirrored state.
- [Utility Hooks](/use-legend/guides/patterns/utility-hooks/) — the full effect hook catalog.
- [Data Fetching](/use-legend/guides/patterns/data-fetching/) — effects that sync with remote sources.
