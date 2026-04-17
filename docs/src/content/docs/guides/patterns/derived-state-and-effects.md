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

Instead, keep everything inside a single return and wrap the ternary in a JSX fragment (`<>...</>`). The Babel plugin only tracks `.get()` calls that appear **inside JSX** — a bare return ternary is not JSX, so wrapping it in a fragment puts it inside the plugin's detection scope:

```tsx
// ✅ Ternary inside JSX — each .get() is a fine-grained leaf
return <>
  {error$.get()
    ? <p>Error: {error$.get()?.message}</p>
    : !isLoaded$.get()
      ? <p>Loading...</p>
      : <div>{data$.name.get()}</div>}
</>;
```

Or derive a view-state observable that captures the branching logic:

```tsx
const view$ = useObservable(() => {
  if (error$.get()) return "error" as const;
  if (!isLoaded$.get()) return "loading" as const;
  return "ready" as const;
});

return <>
  {view$.get() === "error"
    ? <p>Error</p>
    : view$.get() === "loading"
      ? <p>Loading...</p>
      : <div>{data$.name.get()}</div>}
</>;
```

## Scope Context Equivalents

Inside `"use scope"`, use the non-hook versions of these APIs. They are auto-cleaned up when the scope unmounts.

| Hook | Scope equivalent |
|------|-----------------|
| `useObservable(() => ...)` | `observable(() => ...)` |
| `useObserve(fn)` | `observe(fn)` |
| `useWatch(source, fn)` | `watch(source, fn)` |
| `useWhenever(source, fn)` | `whenever(source, fn)` |

```tsx
import { observable, observe, watch, whenever } from "@usels/core";

function SearchSync() {
  "use scope";
  const query$ = observable("");

  // Derived value
  const queryLength$ = observable(() => query$.get().length);

  // Side-effect
  observe(() => {
    console.log("query:", query$.get());
  });

  // Watch with old/new
  watch(query$, (query, prev) => {
    console.log("changed from", prev, "to", query);
  });

  return <input value={query$.get()} onChange={(e) => query$.set(e.currentTarget.value)} />;
}
```

For the full effects reference, see [Effects API](/use-legend/guides/use-scope/effects-api/).

## Related

- [Observable-First Mental Model](/use-legend/guides/observable-first-mental-model/) — why derived observables beat mirrored state.
- [Data Fetching](/use-legend/guides/patterns/data-fetching/) — effects that sync with remote sources.
- [Effects API](/use-legend/guides/use-scope/effects-api/) — canonical reference for `observe()`, `watch()`, `whenever()` in scope context.
