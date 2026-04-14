---
title: Data Fetching
description: Use @usels/tanstack-query when server state should participate in the observable model.
---

`@usels/tanstack-query` bridges TanStack Query and Legend-State. Use it for
server state: cached remote data, loading state, errors, mutations, and
invalidation.

It keeps the TanStack Query option model, but returns query state as observables
and accepts observables in options such as `queryKey` and `enabled`.

## Setup

```tsx
import { QueryClient, QueryClientProvider } from "@usels/tanstack-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductList />
    </QueryClientProvider>
  );
}
```

## Observable Query Key

```tsx
import { observable } from "@usels/core";
import { useQuery } from "@usels/tanstack-query";

const category$ = observable("all");

function ProductList() {
  const query = useQuery({
    queryKey: ["products", category$],
    queryFn: () => fetchProducts(category$.peek()),
  });

  return <p>{query.data.get()?.length ?? 0} products</p>;
}
```

When `category$` changes, the query key changes and the query can refetch.

## What Belongs Where

| State | Place |
| --- | --- |
| Remote cache, loading, errors | `@usels/tanstack-query` |
| Local input draft | Scope |
| Shared app/domain state | Store |
| Persisted client snapshot | Storage helpers |

See the [TanStack Query API reference](/use-legend/tanstack-query/) for
`useQuery`, `useMutation`, `useInfiniteQuery`, and `useQueryClient`.
