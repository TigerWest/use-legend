# useDebounceFn

> Part of `@usels/core` | Category: Utilities

## Overview

Debounce execution of a function.

## Usage

```tsx
import { useDebounceFn } from "@usels/core";

const debouncedFn = useDebounceFn((value: string) => {
  console.log(value);
}, 250);
```

With reactive delay:

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebounceFn } from "@usels/core";

const delay$ = useObservable(300);
const debouncedFn = useDebounceFn(() => {
  // ...
}, delay$);
// Changing delay$ applies the new delay from the next call
```

With `maxWait`:

```tsx
import { useDebounceFn } from "@usels/core";

// Forces execution every 1000ms even with continuous calls
const debouncedFn = useDebounceFn(
  () => {
    // ...
  },
  300,
  { maxWait: 1000 }
);
```

## Type Declarations

```typescript
export { createDebounceFn } from "./core";
export declare function useDebounceFn<T extends AnyFn>(fn: T, ms?: MaybeObservable<number>, options?: DebounceFilterOptions): PromisifyFn<T>;
```

## Source

- Implementation: `packages/core/src/utilities/useDebounceFn/index.ts`
- Documentation: `packages/core/src/utilities/useDebounceFn/index.md`