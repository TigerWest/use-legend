# useThrottledHistory

> Part of `@usels/core` | Category: Reactivity

## Overview

A hook that tracks Observable change history with throttle. A thin wrapper around `useHistory` with `throttleFilter` applied — for rapidly changing values like sliders or drag interactions, it records snapshots at fixed intervals instead of on every change.

## Usage

```tsx
import { useObservable, useThrottledHistory } from "@usels/core";

const slider$ = useObservable(50);

// Record at most once every 300ms
const { undo, redo, canUndo$ } = useThrottledHistory(slider$, { throttle: 300 });
```

### leading / trailing edges

By default both leading and trailing edges fire. Disable either to customize behavior.

```tsx
import { useObservable, useThrottledHistory } from "@usels/core";

const value$ = useObservable(0);

// Only record on the trailing edge (end of throttle window)
const { undo } = useThrottledHistory(value$, {
  throttle: 500,
  leading: false,
  trailing: true,
});
```

### Combined with capacity

```tsx
import { useObservable, useThrottledHistory } from "@usels/core";

const position$ = useObservable({ x: 0, y: 0 });

const { undo, redo } = useThrottledHistory(position$, {
  throttle: 200,
  capacity: 20, // keep at most 20 throttled snapshots
});
```

## Type Declarations

```typescript
export { createThrottledHistory, type ThrottledHistoryOptions } from "./core";
export type UseThrottledHistoryOptions<Raw, Serialized = Raw> = Omit<UseHistoryOptions<Raw, Serialized>, "eventFilter"> & {
    throttle?: MaybeObservable<number>;
    trailing?: boolean;
    leading?: boolean;
};
export type UseThrottledHistoryReturn<Raw, Serialized = Raw> = UseHistoryReturn<Raw, Serialized>;
export declare function useThrottledHistory<Raw, Serialized = Raw>(source$: Observable<Raw>, options?: DeepMaybeObservable<UseThrottledHistoryOptions<Raw, Serialized>>): UseThrottledHistoryReturn<Raw, Serialized>;
```

## Source

- Implementation: `packages/core/src/state/useThrottledHistory/index.ts`
- Documentation: `packages/core/src/state/useThrottledHistory/index.md`