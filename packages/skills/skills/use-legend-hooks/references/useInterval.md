# useInterval

> Part of `@usels/core` | Category: Timer

## Overview

Reactive counter that increments on every interval tick

## Usage

```tsx
import { useInterval } from "@usels/core";

const counter = useInterval(1000);
// counter.get() → 0 initially, then 1, 2, 3... every second
```

### With callback

```tsx
import { useInterval } from "@usels/core";

useInterval(1000, {
  callback: (count) => console.log("tick:", count),
});
```

### With pause/resume/reset controls

```tsx
import { useInterval } from "@usels/core";

const { counter$, reset, isActive$, pause, resume } = useInterval(1000, {
  controls: true,
});

pause(); // stops ticking
resume(); // restarts
reset(); // counter → 0
```

### Manual start (`immediate: false`)

```tsx
import { useInterval } from "@usels/core";

const { counter$, resume } = useInterval(1000, {
  controls: true,
  immediate: false,
});

resume(); // start manually
```

### Reactive interval

```tsx
import { useInterval } from "@usels/core";
import { observable } from "@legendapp/state";

const ms$ = observable(1000);
const counter = useInterval(ms$);

ms$.set(500); // restarts with 500ms period
```

## Type Declarations

```typescript
export { createInterval } from "./core";
export type { IntervalOptions, IntervalReturn } from "./core";
export interface UseIntervalOptions<Controls extends boolean = false> {
    controls?: Controls;
    immediate?: boolean;
    callback?: (count: number) => void;
}
export interface UseIntervalReturn {
    counter$: ReadonlyObservable<number>;
    reset: Fn;
}
export declare function useInterval(interval?: MaybeObservable<number>, options?: UseIntervalOptions<false>): ReadonlyObservable<number>;
export declare function useInterval(interval: MaybeObservable<number>, options: UseIntervalOptions<true>): Readonly<UseIntervalReturn & Pausable>;
```

## Source

- Implementation: `packages/core/src/timer/useInterval/index.ts`
- Documentation: `packages/core/src/timer/useInterval/index.md`