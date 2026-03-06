---
title: useThrottledHistory
category: Reactivity
---

A hook that tracks Observable change history with throttle.
A thin wrapper around `useHistory` with `throttleFilter` applied — for rapidly changing values like sliders or drag interactions, it records snapshots at fixed intervals instead of on every change.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottledHistory } from "@usels/core";

const slider$ = useObservable(50);

// Record at most once every 300ms
const { undo, redo, canUndo$ } = useThrottledHistory(slider$, { throttle: 300 });
```

### leading / trailing edges

By default both leading and trailing edges fire. Disable either to customize behavior.

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottledHistory } from "@usels/core";

const value$ = useObservable(0);

// Only record on the trailing edge (end of throttle window)
const { undo } = useThrottledHistory(value$, {
  throttle: 500,
  leading: false,
  trailing: true,
});
```

### Combined with capacity

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottledHistory } from "@usels/core";

const position$ = useObservable({ x: 0, y: 0 });

const { undo, redo } = useThrottledHistory(position$, {
  throttle: 200,
  capacity: 20, // keep at most 20 throttled snapshots
});
```
