# createStore

> Part of `@usels/core` | Category: State

## Overview

Lazily-initialized store with `StoreProvider`, inter-store dependencies, and Redux DevTools action tracking in development.

## Usage

### Basic store

```tsx
import { observable } from "@legendapp/state";
import { createStore, StoreProvider } from "@usels/core";

const useCountStore = createStore("count", () => {
  const count$ = observable(0);
  const increment = () => count$.set((v) => v + 1);
  return { count$, increment };
});

function App() {
  return (
    <StoreProvider>
      <Counter />
    </StoreProvider>
  );
}

function Counter() {
  const { count$, increment } = useCountStore();
  return <button onClick={increment}>{count$.get()}</button>;
}
```

### Inter-store dependency

Stores can call other store hooks inside their setup function to share state.

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";

const useAuthStore = createStore("auth", () => {
  const user$ = observable<string | null>(null);
  const login = (name: string) => user$.set(name);
  return { user$, login };
});

const useCountStore = createStore("count", () => {
  const { user$ } = useAuthStore(); // access auth store in setup
  const count$ = observable(0);
  return { count$, user$ };
});
```

### Using core utility functions

Core functions like `observe()` work inside store setup because they are not React hooks.

```tsx
import { observable, observe } from "@legendapp/state";
import { createStore } from "@usels/core";

const useDocStore = createStore("doc", () => {
  const content$ = observable("");
  const isDirty$ = observable(false);

  observe(() => {
    if (content$.get()) isDirty$.set(true);
  });

  return { content$, isDirty$ };
});
```

### Redux DevTools integration

Stores auto-connect to Redux DevTools Extension in development mode.
Two types of entries appear in the DevTools timeline:

- **Action entries** (`storeName/actionName`) — logged when an action function returned from the store is called.
- **State entries** (`storeName/__state`) — logged when observables change outside of any action (e.g. async query results, external mutations). Multiple synchronous changes are batched into a single entry.

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";

const useAppStore = createStore("app", () => {
  const theme$ = observable<"light" | "dark">("light");
  const toggleTheme = () => theme$.set((v) => (v === "light" ? "dark" : "light"));

  return { theme$, toggleTheme };
});

// DevTools timeline:
// @@INIT        → { theme$: "light" }
// app/toggleTheme → { theme$: "dark" }
```

State changes from async operations (e.g. fetch results, timers, WebSocket messages) that happen outside of action functions appear as `__state` entries:

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";

const useDataStore = createStore("data", () => {
  const items$ = observable<string[]>([]);
  const isLoading$ = observable(false);

  const fetchItems = async () => {
    isLoading$.set(true); // sync part → "data/fetchItems"
    const res = await fetch("/api/items");
    const data = await res.json();
    items$.set(data); // after await → "data/__state"
    isLoading$.set(false);
  };

  return { items$, isLoading$, fetchItems };
});

// DevTools timeline:
// @@INIT           → { items$: [], isLoading$: false }
// data/fetchItems  → { items$: [], isLoading$: true }      ← sync part of action
// data/__state     → { items$: [...], isLoading$: false }   ← after await
```

## Type Declarations

```typescript
export { createStore, __resetStoreDefinitions, StoreRegistryContext } from "./core";
export type { StoreProviderProps, StoreState, StoreActions, StoreRegistryValue } from "./core";
export declare const StoreProvider: React.FC<{
    children: React.ReactNode;
    _devtools?: boolean;
}>;
```

## Source

- Implementation: `packages/core/src/state/createStore/index.ts`
- Documentation: `packages/core/src/state/createStore/index.md`