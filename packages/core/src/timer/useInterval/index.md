---
title: useInterval
description: Reactive counter that increments on every interval tick
category: Timer
---

A thin wrapper around `useIntervalFn` that exposes a `ReadonlyObservable<number>` counter that increments on each tick.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useInterval } from "@usels/core";

const counter = useInterval(1000);
// counter.get() → 0 initially, then 1, 2, 3... every second
```

### With callback

```tsx
// @noErrors
import { useInterval } from "@usels/core";

useInterval(1000, {
  callback: (count) => console.log("tick:", count),
});
```

### With pause/resume/reset controls

```tsx
// @noErrors
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
// @noErrors
import { useInterval } from "@usels/core";

const { counter$, resume } = useInterval(1000, {
  controls: true,
  immediate: false,
});

resume(); // start manually
```

### Reactive interval

```tsx
// @noErrors
import { useInterval } from "@usels/core";
import { observable } from "@legendapp/state";

const ms$ = observable(1000);
const counter = useInterval(ms$);

ms$.set(500); // restarts with 500ms period
```
