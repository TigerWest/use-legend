---
title: Persisted State
description: Persist observable state with useStorage, useLocalStorage, and hydration-aware UI.
---

Persisted state is still observable state. Use the storage helpers when the
source of truth should survive reloads.

## localStorage

Use `useLocalStorage` for a browser-only component:

```tsx
import { useLocalStorage } from "@usels/web";

function Counter() {
  const count$ = useLocalStorage("count", 0);

  return <button onClick={() => count$.set((count) => count + 1)}>Count {count$.get()}</button>;
}
```

Inside a scope or store setup, use `createLocalStorage`:

```tsx
import { createLocalStorage } from "@usels/web";

function Counter() {
  "use scope";

  const count$ = createLocalStorage("count", 0);

  return <button onClick={() => count$.set((count) => count + 1)}>Count {count$.get()}</button>;
}
```

## Explicit Hydration State

Use `useStorage` when the UI needs to know whether persistence has loaded:

```tsx
import { ObservablePersistIndexedDB } from "@usels/core";
import { useStorage } from "@usels/core";

function Profile() {
  const { data$: profile$, isPersistLoaded$, error$ } = useStorage(
    "profile",
    { name: "" },
    { plugin: ObservablePersistIndexedDB }
  );

  if (error$.get()) return <p>Failed to load profile.</p>;
  if (!isPersistLoaded$.get()) return <p>Loading...</p>;

  return <input value={profile$.name.get()} onChange={(event) => profile$.name.set(event.target.value)} />;
}
```

## Store Pattern

For app state such as carts or preferences, define persisted observables inside a
store and validate the loaded snapshot before marking the store as hydrated.

Use [useStorage](/use-legend/core/useStorage/) for advanced persistence and
[useLocalStorage](/use-legend/web/useLocalStorage/) for the browser
wrapper.
