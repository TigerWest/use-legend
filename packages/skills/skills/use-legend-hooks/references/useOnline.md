# useOnline

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive online state. A thin wrapper around [`useNetwork`](/web/sensors/useNetwork) that returns only the `isOnline Observable.

## Usage

```tsx
import { useOnline } from "@usels/web";

function Component() {
  const isOnline$ = useOnline();

  return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
}
```

### With `onChange` callback

Use `onChange` on the returned Observable to react to network status changes.

```tsx
import { useMount } from "@legendapp/state/react";
import { useOnline } from "@usels/web";

function Component() {
  const isOnline$ = useOnline();

  useMount(() => {
    return isOnline$.onChange(({ value }) => {
      console.log(value ? "Back online" : "Gone offline");
    });
  });

  return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
}
```

## Type Declarations

```typescript
export declare function useOnline(): ReadonlyObservable<boolean>;
```

## Source

- Implementation: `packages/web/src/sensors/useOnline/index.ts`
- Documentation: `packages/web/src/sensors/useOnline/index.md`