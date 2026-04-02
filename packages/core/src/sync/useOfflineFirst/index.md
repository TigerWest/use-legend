---
title: useOfflineFirst
category: sync
---

Reactive offline-first data binding powered by Legend-State's [sync engine](https://legendapp.com/open-source/state/v3/sync/persist-sync/).

Combines remote sync with local persistence and automatic retry. Data is available immediately from local cache, then updated from the remote source. Failed remote operations are persisted locally and retried automatically.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useOfflineFirst } from "@usels/core";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

interface Settings {
  theme: string;
  language: string;
}

function Component() {
  const { data$, isLoaded$, isPersistLoaded$, refetch } = useOfflineFirst<Settings>({
    get: () => fetch("/api/settings").then((r) => r.json()),
    set: ({ value }) =>
      fetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify(value),
      }),
    persistKey: "settings",
    persistPlugin: ObservablePersistLocalStorage,
    initial: { theme: "light", language: "en" },
  });

  return (
    <div>
      {isPersistLoaded$.get() ? (
        <>
          <span>{isLoaded$.get() ? "synced" : "from cache"}</span>
          <span>{data$.theme.get()}</span>
          <button onClick={() => data$.theme.set("dark")}>Dark mode</button>
          <button onClick={refetch}>Sync now</button>
        </>
      ) : (
        <div>Loading cache...</div>
      )}
    </div>
  );
}
```

### Custom retry

```tsx
// @noErrors
import { useOfflineFirst } from "@usels/core";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

function Component() {
  const { data$, clearPersist } = useOfflineFirst<string[]>({
    get: () => fetch("/api/items").then((r) => r.json()),
    persistKey: "items",
    persistPlugin: ObservablePersistLocalStorage,
    initial: [],
    retry: {
      infinite: false,
      backoff: "constant",
      maxDelay: 5000,
    },
  });
}
```
