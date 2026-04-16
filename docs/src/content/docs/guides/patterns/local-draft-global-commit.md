---
title: Local Draft, Global Commit
description: Keep fast-changing draft state local and commit stable domain state to a store.
---

Fast UI state should usually stay local. Shared domain state should usually live
in a store.

This pattern keeps keystroke-level updates close to the component and commits a
debounced value to a shared store.

## Pattern

```tsx
import { useDebounced } from "@usels/core";
import { useObservable, useObserve } from "@legendapp/state/react";

function ProductSearch() {
  const { setQuery } = useProductStore();
  const draft$ = useObservable("");
  const query$ = useDebounced(draft$, { ms: 150 });

  useObserve(() => {
    setQuery(query$.get());
  });

  return (
    <input
      value={draft$.get()}
      onChange={(event) => draft$.set(event.currentTarget.value)}
      placeholder="Search products"
    />
  );
}
```

## Use Local Scope For

- form drafts
- drag positions
- hover and focus details
- sensor values used by one component
- animation frame values

## Commit To Store For

- persisted filters
- cart contents
- user preferences
- data shared across siblings
- values used outside the component that produced them

## Related

- [Derived State & Effects](/use-legend/guides/patterns/derived-state-and-effects/) — when to derive vs. when to commit with an effect.
- [Persisted State](/use-legend/guides/patterns/persisted-state/) — persist committed drafts across reloads.
- [Utility Hooks](/use-legend/guides/patterns/utility-hooks/) — rate-limit hooks used in this pattern.
