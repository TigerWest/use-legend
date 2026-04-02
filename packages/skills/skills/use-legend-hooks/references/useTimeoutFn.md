# useTimeoutFn

> Part of `@usels/core` | Category: Timer

## Overview

Reactive wrapper for setTimeout with start/stop control

## Usage

```tsx
import { useTimeoutFn } from "@usels/core";

const { isPending$, start, stop } = useTimeoutFn(() => {
  console.log("fired!");
}, 1000);

// isPending$.get() === true while waiting
// stop() cancels the pending timeout
// start() restarts the timer (resets if already pending)
```

### Manual start (`immediate: false`)

```tsx
import { useTimeoutFn } from "@usels/core";

const { isPending$, start } = useTimeoutFn(() => console.log("done"), 500, { immediate: false });

// call start() manually when ready
start();
```

### Reactive interval (`MaybeObservable`)

```tsx
import { useTimeoutFn } from "@usels/core";
import { observable } from "@legendapp/state";

const delay$ = observable(1000);
const { start } = useTimeoutFn(() => {}, delay$);
// start() always reads current value of delay$
```

### `immediateCallback`

```tsx
import { useTimeoutFn } from "@usels/core";

const { start } = useTimeoutFn((msg?: string) => console.log("fired", msg), 1000, {
  immediate: false,
  immediateCallback: true,
});

start("hello");
// → cb() called immediately with no args
// → cb("hello") called again after 1000ms
```

## Type Declarations

```typescript
export { createTimeoutFn } from "./core";
export type { TimeoutFnOptions } from "./core";
export type UseTimeoutFnOptions = import("./core").TimeoutFnOptions;
export declare function useTimeoutFn<CallbackFn extends AnyFn>(cb: CallbackFn, interval: MaybeObservable<number>, options?: UseTimeoutFnOptions): Stoppable<Parameters<CallbackFn> | []>;
```

## Source

- Implementation: `packages/core/src/timer/useTimeoutFn/index.ts`
- Documentation: `packages/core/src/timer/useTimeoutFn/index.md`