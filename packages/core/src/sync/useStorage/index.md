---
title: useStorage
description: "Reactive storage binding powered by Legend-State's [persist & sync](https://legendapp.com/open-source/state/v3/sync/persist-sync/) engine."
category: sync
---

Creates an `Observable<T>` that automatically persists to a storage backend. The `plugin` option is required — use `useLocalStorage` or `useSessionStorage` from `@usels/web` for convenience wrappers with pre-configured plugins.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useStorage } from "@usels/core";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

function Component() {
  const { data$: count$, isPersistLoaded$ } = useStorage("count", 0, {
    plugin: ObservablePersistLocalStorage,
  });

  return (
    <>
      {isPersistLoaded$.get() ? (
        <button onClick={() => count$.set(count$.get() + 1)}>Count: {count$.get()}</button>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}
```

### Async plugin (IndexedDB)

```tsx
// @noErrors
import { useStorage } from "@usels/core";
import { ObservablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";

function Component() {
  const { data$, isPersistLoaded$, error$ } = useStorage(
    "app-data",
    { items: [] },
    {
      plugin: ObservablePersistIndexedDB,
    }
  );

  return (
    <div>
      {error$.get() ? (
        <div>Error: {error$.get()?.message}</div>
      ) : isPersistLoaded$.get() ? (
        <div>{data$.items.get().length} items</div>
      ) : (
        <div>Loading storage...</div>
      )}
    </div>
  );
}
```
