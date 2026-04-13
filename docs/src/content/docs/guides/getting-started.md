---
title: Getting Started
description: Install use-legend and build with local scopes, global stores, and fine-grained observable reads.
---

`use-legend` starts from local state, then lets you promote state to a shared
store when it becomes app or domain state.

- Use `"use scope"` for component-local observables and scoped effects.
- Use `createStore()` for provider-scoped global state.
- Use `create*` and `use*` APIs for timers, browser APIs, sensors, sync, and
  integrations without changing the state model.

These examples assume the Vite plugin is configured. The plugin transforms
`"use scope"` into `useScope(...)` and wraps JSX `.get()` reads with `Memo`
boundaries, so only the read expression updates.

## Install

```bash
pnpm add @usels/core @usels/web react
pnpm add -D @usels/vite-plugin @usels/babel-plugin @babel/core
```

Use `@usels/core` for local scopes, global stores, reactivity, timers, and sync
primitives. Add `@usels/web` when you need browser, element, or sensor APIs.

## Configure Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import useLegend from "@usels/vite-plugin";

export default defineConfig({
  plugins: [useLegend(), react()],
});
```

Place `useLegend()` before `react()`. It runs before JSX is compiled.

If you are not using Vite, configure the underlying Babel plugin instead:

```js
// babel.config.js
module.exports = {
  plugins: ["@usels/babel-plugin"],
};
```

## Start With Local Scope

Use `"use scope"` when state belongs to one component or one custom hook.

```tsx
import { observable } from "@usels/core";

function Counter() {
  "use scope";

  const count$ = observable(0);
  const increment = () => count$.set((value) => value + 1);

  return <button onClick={increment}>Clicked {count$.get()} times</button>;
}
```

`count$` and `increment` are created once for that component mount. When
`count$` changes, the text that reads `count$.get()` updates through a
fine-grained boundary instead of making the whole component the default update
unit.

## Add Scoped Effects

Use scope-aware `observe()`, `onMount()`, `onUnmount()`, and `onBeforeMount()`
inside a scope. They are registered to the current scope and cleaned up when the
component unmounts.

```tsx
import { createDebounced, observable, observe } from "@usels/core";

function ProductSearch({ onSearch }: { onSearch: (query: string) => void }) {
  "use scope";

  const draft$ = observable("");
  const debounced$ = createDebounced(draft$, { ms: 150 });

  observe(() => {
    onSearch(debounced$.get());
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

Use `toObs()` when props need reactive tracking inside the scope factory. Plain
prop reads stay available as latest-value reads.

## Promote Shared State To A Store

Use `createStore()` when state needs a provider boundary and shared access across
multiple components.

```tsx
import { createStore, observable, StoreProvider } from "@usels/core";

const [useProductStore, getProductStore] = createStore("products", () => {
  const query$ = observable("");
  const cart$ = observable<Record<string, number>>({});

  const cartCount$ = observable(() =>
    Object.values(cart$.get()).reduce((sum, quantity) => sum + quantity, 0)
  );

  const setQuery = (query: string) => query$.set(query);

  const addToCart = (id: string, quantity = 1) => {
    cart$.set((cart) => ({
      ...cart,
      [id]: (cart[id] ?? 0) + quantity,
    }));
  };

  return { query$, cart$, cartCount$, setQuery, addToCart };
});

function App() {
  return (
    <StoreProvider>
      <CartButton />
    </StoreProvider>
  );
}

function CartButton() {
  const { cartCount$, addToCart } = useProductStore();

  return <button onClick={() => addToCart("keyboard")}>Cart {cartCount$.get()}</button>;
}
```

`createStore(name, setup)` returns `[useStore, getStore]`.

- Use `useStore()` in React components.
- Use `getStore()` inside another store setup function or inside a `"use scope"`
  factory rendered under `StoreProvider`.
- Use `StoreProvider` to isolate store instances for SSR, tests, embedded roots,
  and app boundaries.

## Combine Store And Scope

A common pattern is to keep fast-changing draft state local, then sync the stable
result into a global store.

```tsx
import { createDebounced, observable, observe } from "@usels/core";

function StoreBackedSearch() {
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

This keeps keystroke-level UI state local to the component while the shared store
receives debounced domain state.

## What To Use Next

| Need                               | Use                                           |
| ---------------------------------- | --------------------------------------------- |
| Local component state and effects  | `"use scope"`, `useScope`, `observe`, `toObs` |
| Shared app or domain state         | `createStore()`, `StoreProvider`              |
| Derived values                     | `observable(() => ...)`                       |
| Lists and conditionals             | `For`, `Show`, `Memo`                         |
| Browser, element, and sensor state | `@usels/web` `create*` and `use*` APIs        |
| Data fetching integration          | `@usels/tanstack-query`                       |
