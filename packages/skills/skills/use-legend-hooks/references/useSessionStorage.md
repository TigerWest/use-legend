# useSessionStorage

> Part of `@usels/web` | Category: Browser

## Overview

Reactive `sessionStorage` binding. Thin wrapper around `useStorage` with `ObservablePersistSessionStorage` as the persist plugin. Values persist only for the current browser session.

## Usage

```tsx
import { useSessionStorage } from "@usels/web";

function Component() {
  const step$ = useSessionStorage("wizard-step", 1);

  return (
    <div>
      <p>Step: {step$.get()}</p>
      <button onClick={() => step$.set(step$.get() + 1)}>Next</button>
    </div>
  );
}
```

## Type Declarations

```typescript
export declare function useSessionStorage<T>(key: string, defaults: T): Observable<T>;
```

## Source

- Implementation: `packages/web/src/browser/useSessionStorage/index.ts`
- Documentation: `packages/web/src/browser/useSessionStorage/index.md`