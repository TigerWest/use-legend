---
title: Store & Provider Boundary
description: Use createStore and StoreProvider when observable state belongs to an app, route, feature, or domain.
---

Use a scope for local state. Use a store when state should be shared through a
React subtree or owned by a domain.

`createStore(name, setup)` returns a tuple:

| Tuple item | Use |
| --- | --- |
| `useStore` | Read the store inside React components |
| `getStore` | Access the store inside another store setup or a scope factory |

## Basic Store

```tsx
import { createStore, observable, StoreProvider } from "@usels/core";

const [useCartStore, getCartStore] = createStore("cart", () => {
  const items$ = observable<Record<string, number>>({});
  const count$ = observable(() =>
    Object.values(items$.get()).reduce((total, quantity) => total + quantity, 0)
  );

  const addItem = (id: string) => {
    items$.set((items) => ({ ...items, [id]: (items[id] ?? 0) + 1 }));
  };

  return { items$, count$, addItem };
});

function App() {
  return (
    <StoreProvider>
      <CartButton />
    </StoreProvider>
  );
}

function CartButton() {
  const { count$, addItem } = useCartStore();

  return <button onClick={() => addItem("keyboard")}>Cart {count$.get()}</button>;
}
```

## When To Promote Local State

Keep state local while it is a component concern:

- input draft text
- drag position
- transient hover or focus state
- sensor values used by one widget

Promote it to a store when it becomes shared or domain-owned:

- cart contents
- current account
- route or feature filters
- application settings
- state used by multiple components without prop drilling

## Provider Boundary

`StoreProvider` owns the store registry for its subtree. That boundary matters
for SSR requests, tests, embedded roots, and app shells because every provider
gets isolated store instances.

Use `getStore()` inside another store setup function or inside a `"use scope"`
factory rendered under a provider:

```tsx
function StoreBackedSearch() {
  "use scope";

  const { setQuery } = getSearchStore();
  const draft$ = observable("");

  observe(() => {
    setQuery(draft$.get());
  });

  return <input value={draft$.get()} onChange={(event) => draft$.set(event.currentTarget.value)} />;
}
```

See [Local Draft, Global Commit](/use-legend/guides/patterns/local-draft-global-commit/)
for a full pattern using scopes and stores together.
