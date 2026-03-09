---
title: useQuery
category: Hooks
---

React hook for data fetching that bridges TanStack Query with Legend-State. Returns query state as an `Observable`, and accepts `Observable` values anywhere in the options — including individual elements inside `queryKey`. When an observable value changes, the query automatically re-fetches. Options follow TanStack Query's standard `UseQueryOptions` — refer to [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) for full option details. Each option field accepts `MaybeObservable<T>` for reactive control.

## Demo

## Usage

### Basic query

```tsx twoslash
// @noErrors
import { For, Show, useObservable } from "@legendapp/state/react";
import { useQuery } from "@usels/integrations";

function ProductList() {
  const query = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
  });

  const products$ = useObservable(() => query.data.get() ?? []);

  return (
    <div>
      <Show if={query.isLoading}>
        <p>Loading...</p>
      </Show>
      <Show if={query.isError}>
        <p>Error: {query.error.get()?.message}</p>
      </Show>
      <For each={products$}>{(p$) => <div>{p$.name.get()}</div>}</For>
    </div>
  );
}
```

### Observable in queryKey (auto-refetch)

When an element inside `queryKey` is an `Observable`, the query automatically re-fetches whenever its value changes. Use `.peek()` in `queryFn` to read the current value without registering an extra reactive dependency.

```tsx twoslash
// @noErrors
import { useQuery } from "@usels/integrations";
import { observable } from "@legendapp/state";

const id$ = observable("1");

function UserProfile() {
  const user$ = useQuery({
    queryKey: ["users", id$], // re-fetches when id$ changes
    queryFn: () => fetchUser(id$.peek()),
  });

  return <p>{user$.data.get()?.name}</p>;
}

// Changing id$ triggers a refetch automatically
id$.set("2");
```

The resolved `queryKey` is a plain array (e.g. `['users', '1']`), so cache lookups via `queryClient.getQueryData(['users', '1'])` work as expected.

### Observable inside a nested object in queryKey

Observable values nested inside plain objects within `queryKey` are also resolved reactively.

```tsx twoslash
// @noErrors
import { useQuery } from "@usels/integrations";
import { observable } from "@legendapp/state";

const filter$ = observable({ category: "electronics" });

const list$ = useQuery({
  queryKey: ["products", { filter: filter$.category }],
  queryFn: () => fetchProducts(filter$.category.peek()),
});

// Changing filter$.category triggers a refetch
filter$.category.set("clothing");
```

### Per-field Observable options

Individual options like `enabled`, `staleTime`, etc. also accept `Observable` values.

```tsx twoslash
// @noErrors
import { useQuery } from "@usels/integrations";
import { observable } from "@legendapp/state";

const enabled$ = observable(false);

const data$ = useQuery({
  queryKey: ["dashboard"],
  queryFn: fetchDashboard,
  enabled: enabled$, // query only runs when enabled$ is true
});

// Enable the query dynamically
enabled$.set(true);
```

### Manual refetch

```tsx twoslash
// @noErrors
import { useQuery } from "@usels/integrations";

function DataPanel() {
  const query = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  return (
    <div>
      <p>Updated: {new Date(query.dataUpdatedAt.get()).toLocaleTimeString()}</p>
      <button onClick={() => query.refetch()}>Refresh</button>
    </div>
  );
}
```

## Notes

- **`queryFn` and `.peek()`** — Always use `.peek()` (not `.get()`) inside `queryFn` when reading observable values. Using `.get()` would register reactive dependencies and cause unexpected re-renders.
- **Observable state fields** — All returned fields are `Observable`. To read them in a reactive component, call `.get()`. For non-reactive reads (e.g. event handlers), use `.peek()`.
- **Conditional rendering** — Use `<Show if={obs$}>` from `@legendapp/state/react` for conditional JSX, not `{obs.get() && <JSX>}`.
- **Cache key identity** — Observable elements in `queryKey` are resolved to their plain values before being passed to TanStack Query. The cache key is always a plain array, matching TanStack's standard behavior.
- **`staleTime` and caching** — When `queryKey` changes, TanStack decides whether to fetch fresh data or serve from cache based on `staleTime`. No manual `refetch()` is needed on key changes.
