# useTimeout

> Part of `@usels/core` | Category: Timer

## Overview

Reactive boolean that becomes true after a given delay

## Usage

```tsx
import { useTimeout } from "@usels/core";

const ready$ = useTimeout(1000);
// ready$.get() === false while waiting
// ready$.get() === true after 1000ms
```

### With callback

```tsx
import { useTimeout } from "@usels/core";

useTimeout(500, {
  callback: () => console.log("done!"),
});
```

### With stop/start controls

```tsx
import { useTimeout } from "@usels/core";

const { ready$, isPending$, stop, start } = useTimeout(1000, { controls: true });

stop(); // cancel the pending timeout
start(); // restart the timer
```

### Manual start (`immediate: false`)

```tsx
import { useTimeout } from "@usels/core";

const { ready$, start } = useTimeout(1000, {
  controls: true,
  immediate: false,
});

// call start() when you're ready
start();
```

## Type Declarations

```typescript
export { createTimeout } from "./core";
export type { TimeoutOptions } from "./core";
export interface UseTimeoutOptions<Controls extends boolean = false> {
    controls?: Controls;
    callback?: Fn;
    immediate?: boolean;
}
export declare function useTimeout(interval?: MaybeObservable<number>, options?: UseTimeoutOptions<false>): ReadonlyObservable<boolean>;
export declare function useTimeout(interval: MaybeObservable<number>, options: UseTimeoutOptions<true>): {
    ready$: ReadonlyObservable<boolean>;
} & Stoppable;
```

## Source

- Implementation: `packages/core/src/timer/useTimeout/index.ts`
- Documentation: `packages/core/src/timer/useTimeout/index.md`