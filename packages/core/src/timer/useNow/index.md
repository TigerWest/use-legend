---
title: useNow
description: Reactive current Date that auto-updates on every animation frame or interval
category: Timer
---

Returns a `ReadonlyObservable<Date>` that reflects the current time, updated continuously via `requestAnimationFrame` (default) or a fixed interval.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useNow } from "@usels/core";

const now = useNow();
// now.get() → current Date, updated every frame
```

### Interval-based (battery friendly)

```tsx twoslash
// @noErrors
import { useNow } from "@usels/core";

const now = useNow({ interval: 1000 }); // updates every second
```

### With pause/resume controls

```tsx twoslash
// @noErrors
import { useNow } from "@usels/core";

const { now$, isActive$, pause, resume } = useNow({ controls: true });

pause(); // stops auto-update
resume(); // restarts
```

## Notes

### Scheduler selection

The scheduler is chosen **once at mount** and cannot be changed dynamically:

| `interval` value                    | Scheduler                          |
| ----------------------------------- | ---------------------------------- |
| `'requestAnimationFrame'` (default) | `useRafFn` — smooth, ~60fps        |
| `number` (ms)                       | `useIntervalFn` — battery-friendly |
