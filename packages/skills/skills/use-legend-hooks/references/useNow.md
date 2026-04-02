# useNow

> Part of `@usels/core` | Category: Timer

## Overview

Reactive current Date that auto-updates on every animation frame or interval

## Usage

```tsx
import { useNow } from "@usels/core";

const now = useNow();
// now.get() → current Date, updated every frame
```

### Interval-based (battery friendly)

```tsx
import { useNow } from "@usels/core";

const now = useNow({ interval: 1000 }); // updates every second
```

### With pause/resume controls

```tsx
import { useNow } from "@usels/core";

const { now$, isActive$, pause, resume } = useNow({ controls: true });

pause(); // stops auto-update
resume(); // restarts
```

## Type Declarations

```typescript
export { createNow } from "./core";
export type { NowOptions } from "./core";
export interface UseNowOptions<Controls extends boolean = false> {
    controls?: Controls;
    interval?: "requestAnimationFrame" | number;
}
export declare function useNow(options?: UseNowOptions<false>): ReadonlyObservable<Date>;
export declare function useNow(options: UseNowOptions<true>): {
    now$: ReadonlyObservable<Date>;
} & Pausable;
```

## Source

- Implementation: `packages/core/src/timer/useNow/index.ts`
- Documentation: `packages/core/src/timer/useNow/index.md`