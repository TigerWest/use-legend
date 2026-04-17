---
title: Data Fetching
description: Choose between Legend-State sync and TanStack Query for your data fetching strategy.
---

use-legend offers two paths for fetching and syncing remote data.
Pick the one that fits your data ownership model.

## Two Approaches

- **Legend-State Sync** (`useRemote`, `useOfflineFirst`) — the observable is the data, sync is a trait. You own the data model end-to-end.
- **TanStack Query** (`@usels/tanstack-query`) — query cache owns data, observable wraps query state. For API consumption with caching, deduplication, and pagination.

## Legend-State Sync

Use `useRemote` when the observable itself is the source of truth and the server
is just a backing store.

```tsx
import { useRemote } from "@usels/core";

function Profile() {
  const { data$, isLoaded$ } = useRemote({
    get: () => fetch("/api/profile").then((res) => res.json()),
    set: ({ value }) => fetch("/api/profile", { method: "PUT", body: JSON.stringify(value) }),
    initial: { name: "" },
  });

  return isLoaded$.get()
    ? <input value={data$.name.get()} onChange={(e) => data$.name.set(e.target.value)} />
    : <p>Loading…</p>;
}
```

For offline-first scenarios, `useOfflineFirst` adds local persistence and retry:

```tsx
import { useOfflineFirst } from "@usels/core";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

function Profile() {
  const { data$, isLoaded$ } = useOfflineFirst({
    get: () => fetch("/api/profile").then((res) => res.json()),
    set: ({ value }) => fetch("/api/profile", { method: "PUT", body: JSON.stringify(value) }),
    initial: { name: "" },
    persistKey: "profile",
    persistPlugin: ObservablePersistLocalStorage,
  });

  // data loads from local storage first, then syncs with remote
}
```

## TanStack Query

Use `@usels/tanstack-query` when you need query caching, background refetching,
pagination, or optimistic updates from TanStack Query — with observable results.

```tsx
import { QueryClient, QueryClientProvider } from "@usels/tanstack-query";
import { useQuery } from "@usels/tanstack-query";
import { observable } from "@usels/core";

const queryClient = new QueryClient();
const category$ = observable("all");

function ProductList() {
  const query = useQuery({
    queryKey: ["products", category$],
    queryFn: () => fetchProducts(category$.peek()),
  });

  return <p>{query.data.get()?.length ?? 0} products</p>;
}
```

See the [TanStack Query API reference](/use-legend/tanstack-query/) for
`useQuery`, `useMutation`, `useInfiniteQuery`, and `useQueryClient`.

## Related

- [Derived State & Effects](/use-legend/guides/patterns/derived-state-and-effects/) — compose derived reads over fetched data.
