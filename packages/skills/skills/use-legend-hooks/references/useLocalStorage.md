# useLocalStorage

> Part of `@usels/web` | Category: Browser

## Overview

Reactive `localStorage` binding. Thin wrapper around `useStorage` with `ObservablePersistLocalStorage` as the persist plugin.

## Usage

```tsx
import { useLocalStorage } from "@usels/web";

function Component() {
  const count$ = useLocalStorage("count", 0);

  return <button onClick={() => count$.set(count$.get() + 1)}>Count: {count$.get()}</button>;
}
```

## Type Declarations

```typescript
export declare function useLocalStorage<T>(key: string, defaults: T): Observable<T>;
```

## Source

- Implementation: `packages/web/src/browser/useLocalStorage/index.ts`
- Documentation: `packages/web/src/browser/useLocalStorage/index.md`