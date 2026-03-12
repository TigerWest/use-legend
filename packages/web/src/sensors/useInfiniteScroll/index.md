---
title: useInfiniteScroll
category: sensors
---

Triggers a load callback whenever the scroll position reaches a boundary of a scrollable element, enabling infinite scroll for lists and feeds. Supports all four scroll directions, pre-load distance, manual control, async callbacks, and a finished state to stop loading.

## Demo

## Usage

### Basic

Call `useInfiniteScroll` with a ref to the scrollable element and an async `onLoadMore` callback. The callback fires automatically when the user scrolls to the bottom (default direction).

```tsx twoslash
// @noErrors
import { useRef$ } from "@usels/core";
import { useInfiniteScroll } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  const { isLoading$ } = useInfiniteScroll(el$, async () => {
    const newItems = await fetchNextPage();
    items.push(...newItems);
  });

  return (
    <div ref={el$} style={{ height: 300, overflowY: "auto" }}>
      {/* list items */}
      {isLoading$.get() && <div>Loading…</div>}
    </div>
  );
}
```

### Direction

Use the `direction` option to trigger loading from any edge. Certain directions require specific CSS on the scrollable container so that new content prepends in the correct visual position.

| Direction          | Required CSS                                     |
| ------------------ | ------------------------------------------------ |
| `bottom` (default) | No special settings required                     |
| `top`              | `display: flex; flex-direction: column-reverse;` |
| `left`             | `display: flex; flex-direction: row-reverse;`    |
| `right`            | `display: flex;`                                 |

```tsx twoslash
// @noErrors
import { useRef$ } from "@usels/core";
import { useInfiniteScroll } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  useInfiniteScroll(
    el$,
    async () => {
      /* load older messages */
    },
    {
      direction: "top",
    }
  );

  return (
    <div
      ref={el$}
      style={{ height: 400, overflowY: "auto", display: "flex", flexDirection: "column-reverse" }}
    >
      {/* messages */}
    </div>
  );
}
```

### With distance

Set `distance` (in px) to start loading before the user actually reaches the boundary — useful for pre-fetching the next page early.

```typescript
useInfiniteScroll(el$, onLoadMore, {
  distance: 200, // trigger 200px before the bottom edge
});
```

### Manual load & reset

`load` triggers a load imperatively; `reset` clears the `isFinished$` flag so loading can resume after it was stopped.

```tsx twoslash
// @noErrors
import { useRef$ } from "@usels/core";
import { useInfiniteScroll } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  const { load, reset, isLoading$ } = useInfiniteScroll(el$, async () => {
    await fetchNextPage();
  });

  return (
    <div ref={el$} style={{ height: 300, overflowY: "auto" }}>
      {/* list */}
      <button onClick={load} disabled={isLoading$.get()}>
        Load more
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Async loading

The `onLoadMore` callback can be any async function or return a Promise. `isLoading$` stays `true` for the full duration of the Promise.

```typescript
useInfiniteScroll(el$, async (direction) => {
  const page = await api.getItems({ cursor, direction });
  cursor = page.nextCursor;
  items.push(...page.data);
});
```

### Finish condition

Set `isFinished$.set(true)` inside the callback (or elsewhere) to permanently stop auto-loading. Call `reset()` to resume.

```tsx twoslash
// @noErrors
import { useRef$ } from "@usels/core";
import { useInfiniteScroll } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  const { isFinished$ } = useInfiniteScroll(el$, async () => {
    const page = await fetchNextPage();
    if (!page.hasMore) {
      isFinished$.set(true);
    }
  });

  return (
    <div ref={el$} style={{ height: 300, overflowY: "auto" }}>
      {/* list */}
      {isFinished$.get() && <div>No more items</div>}
    </div>
  );
}
```
