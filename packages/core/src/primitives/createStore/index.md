---
title: createStore
description: "Lazily-initialized store with `StoreProvider`, effectScope lifecycle, inter-store dependencies, and Redux DevTools action tracking in development."
category: Primitives
---

## Demo

## Usage

### Basic store

```tsx twoslash
// @noErrors
import { observable } from "@legendapp/state";
import { createStore, StoreProvider } from "@usels/core";

const [useCountStore] = createStore("count", () => {
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

### Tuple return: `[useStore, getStore]`

`createStore` returns a tuple of two functions:

- **`useStore`** (tuple[0]) — React hook, call inside React components via `useContext`.
- **`getStore`** (tuple[1]) — core accessor, call inside another store's `setup()` or inside a `useScope` factory within a `StoreProvider`.

```tsx
import { createStore } from "@usels/core";

const [useAuthStore, getAuthStore] = createStore("auth", () => {
  const user$ = observable<string | null>(null);
  const login = (name: string) => user$.set(name);
  return { user$, login };
});

// useAuthStore() — call inside React components
// getAuthStore() — call inside another store's setup() or useScope factory
```

### Inter-store dependency

Use `getStore` (tuple[1]) inside another store's `setup()` to declare inter-store dependencies.

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";

const [, getAuthStore] = createStore("auth", () => {
  const user$ = observable<string | null>(null);
  return { user$ };
});

const [useCountStore] = createStore("count", () => {
  const { user$ } = getAuthStore(); // inter-store dep
  const count$ = observable(0);
  return { count$, user$ };
});
```

### `getStore()` inside `useScope`

`getStore` also works inside a `useScope` factory when the component is rendered within a `StoreProvider`. This allows store access in hook-level reactive scopes without prop drilling.

```tsx
import { createStore } from "@usels/core";
import { useScope, observe } from "@usels/core/state/useScope";

const [, getSettingsStore] = createStore("settings", () => {
  const theme$ = observable<"light" | "dark">("light");
  return { theme$ };
});

function useThemeSync() {
  return useScope(() => {
    const { theme$ } = getSettingsStore(); // resolves from StoreProvider

    observe(() => {
      document.documentElement.dataset.theme = theme$.get();
    });

    return {};
  });
}
```

`getStore()` throws if called outside a store `setup()` or outside a `StoreProvider`.

### `useStoreRegistry()`

Returns the current `StoreRegistryValue` from the nearest `StoreProvider`, or `null` if not inside one. Does not throw — useful when you need optional store access.

```tsx
import { useStoreRegistry } from "@usels/core";

function useOptionalStore() {
  const registry = useStoreRegistry(); // null if no StoreProvider
  if (!registry) return null;
  // use registry...
}
```

### Lifecycle: `onMount` and `onUnmount`

Call `onMount` and `onUnmount` inside a store's `setup()` to register lifecycle callbacks.
The `StoreProvider` runs `onMount` when it mounts and disposes scopes (running `onUnmount`) when it unmounts.

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";
import { onMount, onUnmount } from "@usels/core/state/useScope/effectScope";

const [useWebSocketStore] = createStore("ws", () => {
  const messages$ = observable<string[]>([]);
  let socket: WebSocket | null = null;

  onMount(() => {
    socket = new WebSocket("wss://example.com");
    socket.onmessage = (e) => messages$.set((prev) => [...prev, e.data]);
    return () => socket?.close();
  });

  return { messages$ };
});
```

`onUnmount` is shorthand for `onMount(() => cb)` when you only need cleanup:

```tsx
onUnmount(() => {
  resource.dispose();
});
```

### Reactive subscriptions with `observe`

Use `observe` from the scope-aware import so subscriptions are automatically cleaned up when the `StoreProvider` unmounts.

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";
import { observe } from "@usels/core/state/useScope/observe";

const [useDocStore] = createStore("doc", () => {
  const content$ = observable("");
  const isDirty$ = observable(false);

  observe(() => {
    if (content$.get()) isDirty$.set(true);
  });

  return { content$, isDirty$ };
});
```

### Lazy init limitation

`onMount` is only called for stores that are **first accessed during the initial render** (before `StoreProvider`'s `useEffect` runs). Stores accessed for the first time after the provider has mounted will not have their `onMount` callbacks executed.

```tsx
// ✅ Store accessed in initial render — onMount fires
function App() {
  return (
    <StoreProvider>
      <ComponentThatUsesStore />
    </StoreProvider>
  );
}

// ⚠️ Store accessed after mount — onMount does NOT fire
function App() {
  const [show, setShow] = useState(false);
  return (
    <StoreProvider>
      <button onClick={() => setShow(true)}>Show</button>
      {show && <ComponentThatUsesStore />}
    </StoreProvider>
  );
}
```

### Redux DevTools integration

Stores auto-connect to Redux DevTools Extension in development mode.

- **Action entries** (`storeName/actionName`) — logged when an action function is called.
- **State entries** (`storeName/__state`) — logged when observables change outside an action. Multiple synchronous changes are batched into one entry.

```tsx
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";

const [useAppStore] = createStore("app", () => {
  const theme$ = observable<"light" | "dark">("light");
  const toggleTheme = () => theme$.set((v) => (v === "light" ? "dark" : "light"));
  return { theme$, toggleTheme };
});

// DevTools timeline:
// @@INIT          → { theme$: "light" }
// app/toggleTheme → { theme$: "dark" }
```

## StoreProvider

`StoreProvider` is required. It isolates stores per provider instance for SSR safety.
Stores are lazily initialized on first hook call and cached within the provider.
The provider is responsible for executing `onMount` and `onUnmount` lifecycle callbacks.

```tsx
import { createStore, StoreProvider } from "@usels/core";

function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
```
