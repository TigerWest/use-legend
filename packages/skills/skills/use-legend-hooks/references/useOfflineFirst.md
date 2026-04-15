# useOfflineFirst

> Part of `@usels/core` | Category: Sync

## Overview

Reactive offline-first data binding powered by Legend-State's [sync engine](https://legendapp.com/open-source/state/v3/sync/persist-sync/).

## Usage

```tsx
import { useOfflineFirst } from "@usels/core";
import { ObservablePersistLocalStorage } from "@usels/web";

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
import { useOfflineFirst } from "@usels/core";
import { ObservablePersistLocalStorage } from "@usels/web";

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

## Type Declarations

```typescript
export { createOfflineFirst } from "./core";
export type { OfflineFirstOptions, OfflineFirstReturn } from "./core";
export type UseOfflineFirstOptions<T> = import("./core").OfflineFirstOptions<T>;
export type UseOfflineFirstReturn<T> = import("./core").OfflineFirstReturn<T>;
export declare function useOfflineFirst<T>(options: UseOfflineFirstOptions<T>): UseOfflineFirstReturn<T>;
```

## Source

- Implementation: `packages/core/src/sync/useOfflineFirst/index.ts`
- Documentation: `packages/core/src/sync/useOfflineFirst/index.md`