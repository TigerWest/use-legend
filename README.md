# use-legend

**Fine-grained updates. Zero wasted renders.**

`use-legend` is a set of React state primitives and utilities built on
[Legend-State](https://legendapp.com/open-source/state/). Use it for
component-local observables, provider-scoped global stores, and observable-first
utility hooks that update the exact UI reads that changed.

## Why

- `useObservable()` replaces `useState` with an observable that updates only the
  JSX leaves that read it — the component function does not re-run.
- `createStore()` gives you provider-scoped global stores with observable state,
  actions, lifecycle cleanup, inter-store access, and SSR-safe boundaries.
- `use*` utility hooks cover timers, browser APIs, sensors, sync, and
  integrations without switching away from the same observable model.

The result is direct DX for stateful React code and a faster UX path: observable
reads update fine-grained render boundaries instead of forcing whole components
to re-render by default.

## Installation

```bash
pnpm add @usels/core @legendapp/state@beta @usels/web
pnpm add -D @usels/vite-plugin
```

Use `@usels/core` for local state, global stores, reactivity, timers, and sync
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

Put `useLegend()` before `react()`. The plugin wraps observable `.get()` reads
in JSX with fine-grained `Memo` boundaries — the component renders once, and
only the leaf holding `.get()` updates when the observable changes.

## Quick Start

```tsx
import { useRef } from "react";
import { useObservable } from "@legendapp/state/react";

function Counter() {
  const count$ = useObservable(0);
  const renders = useRef(0);
  renders.current += 1;

  return (
    <div>
      <button onClick={() => count$.set((c) => c + 1)}>
        Clicked {count$.get()} times
      </button>
      <p>renderCount: {renders.current}</p>
    </div>
  );
}
```

Click the button — `count$.get()` updates but `renderCount` stays at `1`. The
component function never re-runs.

## Reactive Effects

Use `useObserve()` to run work whenever an observable changes. Combine with
utility hooks like `useDebounced()`:

```tsx
import { useDebounced } from "@usels/core";
import { useObservable, useObserve } from "@legendapp/state/react";

function ProductSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const draft$ = useObservable("");
  const debounced$ = useDebounced(draft$, { ms: 150 });

  useObserve(() => {
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

## Global Store

Use `createStore()` when app or domain state should be shared through a React
tree.

```tsx
import { createStore, observable, StoreProvider } from "@usels/core";

const [useProductStore] = createStore("products", () => {
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

`useProductStore()` reads the store from the nearest `StoreProvider`.
`StoreProvider` owns the store registry for its subtree — that keeps store
instances isolated across SSR requests, app shells, tests, or embedded roots.

## Mental Model

| Need                              | API                                      |
| --------------------------------- | ---------------------------------------- |
| Local component state             | `useObservable()`                        |
| Reactive side effects             | `useObserve()`, `useWatch()`, `useWhenever()` |
| Global app or domain state        | `createStore()`                          |
| Observable utility hooks          | `useDebounced()`, `useIntervalFn()`, ... |
| Render boundaries                 | `Memo`, `For`, or the Vite/Babel transform |

## Packages

| Package                                                        | Role                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`@usels/core`](./packages/core)                               | Store, reactivity, timers, sync primitives, and Legend-State exports         |
| [`@usels/web`](./packages/web)                                 | Browser, element, and sensor APIs                                           |
| [`@usels/tanstack-query`](./packages/libraries/tanstack-query) | Observable-native TanStack Query integration                                |
| [`@usels/vite-plugin`](./packages/vite)                        | Vite transform for JSX `.get()` reads                                       |
| [`@usels/babel-plugin`](./packages/babel)                      | Underlying Babel transform used by the Vite plugin                          |
| [`@usels/eslint-plugin`](./packages/eslint)                    | Lint rules for observable naming and render patterns                         |

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
