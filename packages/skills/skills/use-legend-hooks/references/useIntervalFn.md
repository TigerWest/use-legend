# useIntervalFn

> Part of `@usels/core` | Category: Timer

## Overview

Reactive setInterval wrapper with pause/resume control

## Usage

```tsx
import { useIntervalFn } from "@usels/core";

const { isActive, pause, resume } = useIntervalFn(() => {
  console.log("tick");
}, 1000);

// isActive.get() === true while running
// pause() / resume() to control execution
```

### `immediateCallback`

```tsx
import { useIntervalFn } from "@usels/core";

useIntervalFn(() => fetchData(), 5000, { immediateCallback: true });
// calls fetchData() immediately on resume, then every 5s
```

### Reactive interval

```tsx
import { useIntervalFn } from "@usels/core";
import { observable } from "@legendapp/state";

const ms$ = observable(1000);
useIntervalFn(() => {}, ms$);
// ms$.set(500) → automatically restarts with new interval
```

## Type Declarations

```typescript
export { createIntervalFn } from "./core";
export type { IntervalFnOptions } from "./core";
export type UseIntervalFnOptions = IntervalFnOptions;
export declare function useIntervalFn(cb: AnyFn, interval?: MaybeObservable<number>, options?: IntervalFnOptions): Pausable;
```

## Source

- Implementation: `packages/core/src/timer/useIntervalFn/index.ts`
- Documentation: `packages/core/src/timer/useIntervalFn/index.md`