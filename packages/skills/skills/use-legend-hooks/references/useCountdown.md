# useCountdown

> Part of `@usels/core` | Category: Timer

## Overview

Reactive countdown timer with pause/resume/reset controls

## Usage

### Basic

```tsx
import { useCountdown } from "@usels/core";

const { remaining$ } = useCountdown(60);
// remaining$.get() → 60, 59, 58, ... 0
```

### With callbacks

```tsx
import { useCountdown } from "@usels/core";

const { remaining$ } = useCountdown(10, {
  onTick: (remaining) => console.log(`${remaining}s left`),
  onComplete: () => console.log("Done!"),
});
```

### Custom interval

```tsx
import { useCountdown } from "@usels/core";

// Tick every 500ms instead of the default 1000ms
const { remaining$ } = useCountdown(30, { interval: 500 });
```

### Manual start

```tsx
import { useCountdown } from "@usels/core";

const { remaining$, start } = useCountdown(10, { immediate: false });
// remaining$.get() === 10 (not started)
// start() to begin countdown
```

### Reset / Stop / Start controls

```tsx
import { useCountdown } from "@usels/core";

const { remaining$, reset, stop, start, pause, resume } = useCountdown(60);

// reset()       → remaining$ back to 60 (timer keeps running)
// reset(30)     → remaining$ set to 30
// stop()        → pause + reset (fully stop)
// start()       → reset + resume (restart)
// start(30)     → reset to 30 + resume
// pause()       → freeze countdown
// resume()      → continue from current remaining$
```

## Type Declarations

```typescript
export { createCountdown } from "./core";
export type { CountdownOptions, CountdownReturn } from "./core";
export interface UseCountdownOptions {
    interval?: number;
    immediate?: boolean;
    onTick?: (remaining: number) => void;
    onComplete?: () => void;
}
export interface UseCountdownReturn extends Pausable {
    remaining$: ReadonlyObservable<number>;
    reset: (count?: number) => void;
    stop: Fn;
    start: (count?: number) => void;
}
export declare function useCountdown(initialCount: MaybeObservable<number>, options?: DeepMaybeObservable<UseCountdownOptions>): UseCountdownReturn;
```

## Source

- Implementation: `packages/core/src/timer/useCountdown/index.ts`
- Documentation: `packages/core/src/timer/useCountdown/index.md`