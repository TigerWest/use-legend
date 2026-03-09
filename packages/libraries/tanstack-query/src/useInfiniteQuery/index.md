---
title: useInfiniteQuery
category: Hooks
---

React hook for infinite scrolling and pagination that bridges TanStack Query with Legend-State. Returns query state as an `Observable`, and accepts `Observable` values in options and `queryKey` — just like `useQuery`. Refer to [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery) for full option details. Options like `enabled`, `staleTime`, `gcTime`, etc. accept `MaybeObservable<T>` for reactive control.

## Demo

## Usage

### Basic infinite query

```tsx twoslash
// @noErrors
import { For, Show, useObservable } from "@legendapp/state/react";
import { useInfiniteQuery } from "@usels/tanstack-query";

interface Page {
  items: { id: number; name: string }[];
  nextCursor: number | null;
}

function InfiniteList() {
  const query = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam }) =>
      fetch(`/api/items?cursor=${pageParam}`).then((r) => r.json() as Promise<Page>),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allItems$ = useObservable(() =>
    (query.data.get()?.pages ?? []).flatMap((page) => page.items)
  );

  return (
    <div>
      <Show if={query.isLoading}>
        <p>Loading...</p>
      </Show>
      <For each={allItems$}>{(item$) => <div>{item$.name.get()}</div>}</For>
      <Show if={query.hasNextPage}>
        <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage.get()}>
          <Show if={query.isFetchingNextPage} else="Load More">
            Loading more...
          </Show>
        </button>
      </Show>
    </div>
  );
}
```

### Observable queryKey

```tsx twoslash
// @noErrors
import { useInfiniteQuery } from "@usels/tanstack-query";
import { observable } from "@legendapp/state";
import { For, useObservable } from "@legendapp/state/react";

const category$ = observable("all");

function FilteredInfiniteList() {
  const query = useInfiniteQuery({
    queryKey: ["items", category$],
    queryFn: ({ pageParam }) =>
      fetch(`/api/items?category=${category$.peek()}&cursor=${pageParam}`).then((r) => r.json()),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allItems$ = useObservable(() =>
    (query.data.get()?.pages ?? []).flatMap((page: any) => page.items)
  );

  return (
    <div>
      <select onChange={(e) => category$.set(e.target.value)}>
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      {/* query auto-refetches when category$ changes */}
      <For each={allItems$}>{(item$) => <div>{item$.name.get()}</div>}</For>
    </div>
  );
}
```

### Conditional fetching with Observable enabled

```tsx twoslash
// @noErrors
import { useInfiniteQuery } from "@usels/tanstack-query";
import { observable } from "@legendapp/state";

const isReady$ = observable(false);

const query = useInfiniteQuery({
  queryKey: ["feed"],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.next,
  enabled: isReady$, // only starts fetching when isReady$ becomes true
});

// Later...
isReady$.set(true); // triggers the first fetch
```

## Notes

- **Same Observable pattern as `useQuery`** — `queryKey` elements, `enabled`, `staleTime`, and other options accept `Observable` values. When they change, the query automatically reacts.
- **`queryFn` and `.peek()`** — Use `.peek()` inside `queryFn` to read observable values without registering reactive dependencies.
- **Pagination methods** — `fetchNextPage`, `fetchPreviousPage`, and `refetch` are methods on the Observable. Call them directly: `query.fetchNextPage()`.
- **Conditional rendering** — Use `<Show if={obs$}>` from `@legendapp/state/react` for conditional JSX, not `{obs.get() && <JSX>}`.
- **`data` shape** — `data.get()` returns `InfiniteData<TData>` with `pages` (array of page results) and `pageParams` (array of page parameters).
