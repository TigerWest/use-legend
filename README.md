# use-legend

**Fine-grained updates. Zero wasted renders.**

`use-legend` is a set of React state primitives and utilities built on
[Legend-State](https://legendapp.com/open-source/state/). Use it for
local component scopes, provider-scoped global stores, and observable-first
utility APIs that update the exact UI reads that changed.

## Why

- `"use scope"` gives components and hooks local state that is created once per
  mount, then cleaned up automatically.
- `createStore()` gives you provider-scoped global stores with observable state,
  actions, lifecycle cleanup, inter-store access, and SSR-safe boundaries.
- `create*` and `use*` utilities cover timers, browser APIs, sensors, sync, and
  integrations without switching away from the same observable model.

The result is direct DX for stateful React code and a faster UX path: observable
reads update fine-grained render boundaries instead of forcing whole components
to re-render by default.

## Installation

```bash
pnpm add @usels/core @usels/web
pnpm add -D @usels/vite-plugin
```

Use `@usels/core` for local scopes, global stores, reactivity, timers, and sync
primitives. Add `@usels/web` when you need browser, element, or sensor APIs.

## Vite Setup

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import useLegend from "@usels/vite-plugin";

export default defineConfig({
  plugins: [useLegend(), react()],
});
```

Put `useLegend()` before `react()`. The plugin handles both JSX `.get()` reads
and local scope syntax:

- wraps observable `.get()` reads in JSX with `Memo` boundaries
- transforms `"use scope"` into `useScope(...)`

## Local Scope

Start with `"use scope"` when state belongs to one component or hook, but still
needs observable updates and scoped cleanup.

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

The directive keeps the component body readable while the plugin emits
`useScope(...)`. Local observables are created once per mount, and `observe()`,
`onMount()`, `onUnmount()`, and `onBeforeMount()` are registered to the active
scope for cleanup.

Use `toObs()` when scope props need reactive tracking inside the factory. Plain
prop reads stay available as latest-value reads.

## Global Store

Use `createStore()` when app or domain state should be shared through a React
tree.

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

`createStore(name, setup)` returns `[useStore, getStore]`. Use `useStore()` in
React components. Use `getStore()` inside another store setup function or inside
a `"use scope"` factory rendered under a `StoreProvider`.

`StoreProvider` owns the store registry for its subtree. That keeps store
instances isolated across SSR requests, app shells, tests, or embedded roots.

## Mental Model

| Need                              | API                                                |
| --------------------------------- | -------------------------------------------------- |
| Local component state and effects | `"use scope"`                                      |
| Global app or domain state        | `createStore()`                                    |
| Reusable observable primitives    | `create*`                                          |
| React hook wrappers               | `use*`                                             |
| Render boundaries                 | `Memo`, `Show`, `For`, or the Vite/Babel transform |

## Packages

| Package                                                        | Role                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`@usels/core`](./packages/core)                               | Store, scope, reactivity, timers, sync primitives, and Legend-State exports |
| [`@usels/web`](./packages/web)                                 | Browser, element, and sensor APIs                                           |
| [`@usels/tanstack-query`](./packages/libraries/tanstack-query) | Observable-native TanStack Query integration                                |
| [`@usels/vite-plugin`](./packages/vite)                        | Vite transform for JSX `.get()` reads and `"use scope"`                     |
| [`@usels/babel-plugin`](./packages/babel)                      | Underlying Babel transform used by the Vite plugin                          |
| [`@usels/eslint-plugin`](./packages/eslint)                    | Lint rules for observable naming and render patterns                        |

## Links

- [Documentation](https://tigerwest.github.io/use-legend/)
- [GitHub](https://github.com/TigerWest/use-legend)
- [Legend-State](https://legendapp.com/open-source/state/)

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Requirements

- Node >= 18.0.0
- pnpm >= 8.0.0

## License

MIT
