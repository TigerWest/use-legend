---
title: createStore
category: State
sidebar:
  order: 0
---

Lazily-initialized store with `StoreProvider`, inter-store dependencies, and Redux DevTools action tracking in development.

## Demo

## Usage

### Basic store

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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
Only **action functions** returned from the store are tracked — each call is logged as `storeName/actionName`. Direct observable mutations without an action function are not tracked.

```tsx twoslash
// @noErrors
import { observable } from "@legendapp/state";
import { createStore } from "@usels/core";

const useAppStore = createStore("app", () => {
  const theme$ = observable<"light" | "dark">("light");
  const toggleTheme = () => theme$.set((v) => (v === "light" ? "dark" : "light"));

  return { theme$, toggleTheme };
});

// DevTools shows:
// - Initial state: { theme: "light" }
// - On toggleTheme() call: action "app/toggleTheme"
```

## StoreProvider

`StoreProvider` is required. It isolates stores per provider instance for SSR safety.
Stores are lazily initialized on first hook call and cached within the provider.

```tsx twoslash
// @noErrors
import { createStore, StoreProvider } from "@usels/core";

// ✅ StoreProvider wraps all store consumers
function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
```
