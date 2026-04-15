# useStorage

> Part of `@usels/core` | Category: Sync

## Overview

Reactive storage binding powered by Legend-State's [persist & sync](https://legendapp.com/open-source/state/v3/sync/persist-sync/) engine.

## Usage

```tsx
import { useStorage } from "@usels/core";
import { ObservablePersistLocalStorage } from "@usels/web";

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
import { useStorage } from "@usels/core";
import { ObservablePersistIndexedDB } from "@usels/web";

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

## Type Declarations

```typescript
export { createStorage } from "./core";
export type { StorageOptions, StorageReturn } from "./core";
export type UseStorageOptions = import("./core").StorageOptions;
export type UseStorageReturn<T> = import("./core").StorageReturn<T>;
export declare function useStorage<T>(key: string, defaults: T, options: UseStorageOptions): UseStorageReturn<T>;
```

## Source

- Implementation: `packages/core/src/sync/useStorage/index.ts`
- Documentation: `packages/core/src/sync/useStorage/index.md`