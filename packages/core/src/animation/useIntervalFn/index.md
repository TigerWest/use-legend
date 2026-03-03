---
title: useIntervalFn
description: Reactive setInterval wrapper with pause/resume control
category: Animation
---

Execute a function repeatedly at a given interval with reactive `isActive` state and pause/resume control.
Returns a `Pausable` — `isActive` is a `ReadonlyObservable<boolean>`.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useIntervalFn } from "@usels/core";

const { isActive, pause, resume } = useIntervalFn(() => {
  console.log("tick");
}, 1000);

// isActive.get() === true while running
// pause() / resume() to control execution
```

### `immediateCallback`

```tsx twoslash
// @noErrors
import { useIntervalFn } from "@usels/core";

useIntervalFn(() => fetchData(), 5000, { immediateCallback: true });
// calls fetchData() immediately on resume, then every 5s
```

### Reactive interval

```tsx twoslash
// @noErrors
import { useIntervalFn } from "@usels/core";
import { observable } from "@legendapp/state";

const ms$ = observable(1000);
useIntervalFn(() => {}, ms$);
// ms$.set(500) → automatically restarts with new interval
```

## Notes

`interval` must be a positive number. `0` or negative values are passed directly to `setInterval`, which the browser clamps to ~4ms. Use `pause()` to stop execution instead of setting `interval` to `0`.
