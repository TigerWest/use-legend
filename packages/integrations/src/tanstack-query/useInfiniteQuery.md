---
title: useInfiniteQuery
description: TanStack infinite query hook with pagination support
category: Hooks
---

React hook for infinite scrolling and pagination with observable state.

## Parameters

- `options.queryKey`: Query key (static or observable)
- `options.queryFn`: Function to fetch page data
- `options.getNextPageParam`: Function to get next page parameter
- `options.getPreviousPageParam`: Function to get previous page parameter
- Other TanStack InfiniteQuery options...

## Returns

Observable containing infinite query state with `data`, `fetchNextPage`, etc.

## Usage

```typescript
import { useInfiniteQuery } from '@las/integrations'

function InfiniteList() {
  const query = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 0 }) => fetchItems(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })

  return (
    <div>
      {query.data.pages.get()?.map((page) =>
        page.items.map((item) => <div key={item.id}>{item.name}</div>)
      )}
      <button onClick={() => query.fetchNextPage.get()()}>
        Load More
      </button>
    </div>
  )
}
```
