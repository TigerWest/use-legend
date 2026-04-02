# useSilentObservable

> Part of `@usels/core` | Category: Reactivity

## Overview

Observable augmented with a `silentSet` method that updates the value immediately without triggering listeners or re-renders.

## Usage

```tsx
import { useSilentObservable } from "@usels/core";

const count$ = useSilentObservable(0);

// silentSet — updates value immediately, no listeners or re-renders
count$.silentSet(5);
count$.peek(); // 5

// Standard set — triggers listeners and re-renders as usual
count$.set(10);
count$.get(); // 10
```

### Skipping onChange during internal updates

```tsx
import { useSilentObservable } from "@usels/core";

const position$ = useSilentObservable({ x: 0, y: 0 });

// Update position without notifying subscribers (e.g. during a drag loop)
position$.silentSet({ x: 100, y: 200 });

// When ready to notify (e.g. on drag end), use standard set
position$.set({ x: 100, y: 200 });
```

### Using `setSilently` directly (Legend-State built-in)

Legend-State provides a `setSilently` utility function that works on any Observable.
If you only need a one-off silent update without a dedicated hook, you can use it directly.

```tsx
import { observable, setSilently } from "@legendapp/state";

const count$ = observable(0);

setSilently(count$, 5); // value is now 5, no listeners fire
count$.peek(); // 5
```

## Type Declarations

```typescript
export type SilentObservable<T> = Observable<T> & {
    silentSet: (value: T) => void;
};
export declare function useSilentObservable<T>(initialValue: T): SilentObservable<T>;
```

## Source

- Implementation: `packages/core/src/reactivity/useSilentObservable/index.ts`
- Documentation: `packages/core/src/reactivity/useSilentObservable/index.md`