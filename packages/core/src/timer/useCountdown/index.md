---
title: useCountdown
description: Reactive countdown timer with pause/resume/reset controls
category: Timer
---

A reactive countdown timer built on `useIntervalFn`. Decrements a counter by 1 on each tick, auto-pauses at 0, and provides full `Pausable` controls plus `reset`, `stop`, and `start`.

## Demo

## Usage

### Basic

```tsx twoslash
// @noErrors
import { useCountdown } from "@usels/core";

const { remaining$ } = useCountdown(60);
// remaining$.get() → 60, 59, 58, ... 0
```

### With callbacks

```tsx
// @noErrors
import { useCountdown } from "@usels/core";

const { remaining$ } = useCountdown(10, {
  onTick: (remaining) => console.log(`${remaining}s left`),
  onComplete: () => console.log("Done!"),
});
```

### Custom interval

```tsx
// @noErrors
import { useCountdown } from "@usels/core";

// Tick every 500ms instead of the default 1000ms
const { remaining$ } = useCountdown(30, { interval: 500 });
```

### Manual start

```tsx
// @noErrors
import { useCountdown } from "@usels/core";

const { remaining$, start } = useCountdown(10, { immediate: false });
// remaining$.get() === 10 (not started)
// start() to begin countdown
```

### Reset / Stop / Start controls

```tsx
// @noErrors
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
