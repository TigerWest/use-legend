# useRemote

> Part of `@usels/core` | Category: Sync

## Overview

Reactive remote data binding powered by Legend-State's [sync engine](https://legendapp.com/open-source/state/v3/sync/persist-sync/).

## Usage

### Read-only

```tsx
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

## Type Declarations

```typescript
export { createRemote } from "./core";
export type { RemoteOptions, RemoteReturn } from "./core";
export type UseRemoteOptions<T> = import("./core").RemoteOptions<T>;
export type UseRemoteReturn<T> = import("./core").RemoteReturn<T>;
export declare function useRemote<T>(options: UseRemoteOptions<T>): UseRemoteReturn<T>;
```

## Source

- Implementation: `packages/core/src/sync/useRemote/index.ts`
- Documentation: `packages/core/src/sync/useRemote/index.md`