---
title: useRemote
description: "Reactive remote data binding powered by Legend-State's [sync engine](https://legendapp.com/open-source/state/v3/sync/persist-sync/)."
category: sync
---

Creates an `Observable<T>` that fetches from and optionally pushes to a remote source. No local persistence — data lives only in memory. Returns decomposed state including loading and error observables.

## Demo

## Usage

### Read-only

```tsx twoslash
// @noErrors
import { useRemote } from "@usels/core";

interface User {
  id: number;
  name: string;
}

function Component() {
  const { data$, isLoaded$, error$ } = useRemote<User | null>({
    get: () => fetch("/api/user").then((r) => r.json()),
    initial: null,
  });

  return (
    <div>
      {error$.get() ? (
        <div>Error: {error$.get()?.message}</div>
      ) : isLoaded$.get() ? (
        <div>{data$.get()?.name}</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
```

### Read & write

```tsx
// @noErrors
import { useRemote } from "@usels/core";

function Component() {
  const { data$, refetch } = useRemote<{ count: number }>({
    get: () => fetch("/api/counter").then((r) => r.json()),
    set: ({ value }) =>
      fetch("/api/counter", {
        method: "PUT",
        body: JSON.stringify(value),
      }),
    initial: { count: 0 },
    debounceSet: 500,
  });

  return (
    <div>
      <span>{data$.count.get()}</span>
      <button onClick={() => data$.count.set((c) => c + 1)}>+1</button>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```
