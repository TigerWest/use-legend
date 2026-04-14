---
title: Local Draft, Global Commit
description: Keep fast-changing draft state in a scope and commit stable domain state to a store.
---

Fast UI state should usually stay local. Shared domain state should usually live
in a store.

This pattern keeps keystroke-level updates close to the component and commits a
debounced value to a shared store.

## Pattern

```tsx
import { createDebounced, observable, observe } from "@usels/core";

function ProductSearch() {
  "use scope";

  const { setQuery } = getProductStore();
  const draft$ = observable("");
  const query$ = createDebounced(draft$, { ms: 150 });

  observe(() => {
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

Use [Store & Provider Boundary](/use-legend/guides/concepts/store-and-provider-boundary/)
for the store model and [Scope & Lifecycle](/use-legend/guides/concepts/scope-and-lifecycle/)
for scope cleanup.
