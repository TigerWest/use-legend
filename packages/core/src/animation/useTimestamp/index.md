---
title: useTimestamp
description: Reactive Unix timestamp (ms) that auto-updates on every animation frame or interval
category: Animation
---

Returns a `ReadonlyObservable<number>` containing the current Unix timestamp in milliseconds, updated continuously via `requestAnimationFrame` (default) or a fixed interval.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useTimestamp } from "@usels/core";

const ts = useTimestamp();
// ts.get() → current Date.now(), updated every frame
```

### With offset

```tsx twoslash
// @noErrors
import { useTimestamp } from "@usels/core";
import { observable } from "@legendapp/state";

const offset$ = observable(5000);
const ts = useTimestamp({ offset: offset$ });
// ts.get() → Date.now() + 5000 — offset is reactive, updates each tick
```

### With callback

```tsx twoslash
// @noErrors
import { useTimestamp } from "@usels/core";

const ts = useTimestamp({
  callback: (timestamp) => {
    console.log("tick:", timestamp);
  },
});
```

### With pause/resume controls

```tsx twoslash
// @noErrors
import { useTimestamp } from "@usels/core";

const { timestamp$, isActive$, pause, resume } = useTimestamp({ controls: true });
```

## Notes

### Reactive `offset`

`offset` is read on every tick inside the update loop, so changing it (via Observable) takes effect on the next frame without restarting the scheduler.
