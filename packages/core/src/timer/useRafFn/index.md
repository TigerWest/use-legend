---
title: useRafFn
description: Call a function on every requestAnimationFrame with pause/resume control
category: Timer
---

Execute a function on every animation frame (`requestAnimationFrame`) with reactive `isActive` state and pause/resume control.
The callback receives `delta` (ms since last frame) and `timestamp` (ms since page load).

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useRafFn } from "@usels/core";

const { isActive, pause, resume } = useRafFn(({ delta, timestamp }) => {
  // called ~60 times/sec
  console.log(`delta: ${delta}ms`);
});
```

### FPS limit

```tsx twoslash
// @noErrors
import { useRafFn } from "@usels/core";
import { observable } from "@legendapp/state";

const fps$ = observable(30);
useRafFn(({ delta }) => {}, { fpsLimit: fps$ });
// caps execution to 30fps; fps$.set(60) applies next frame
```

### Run once

```tsx twoslash
// @noErrors
import { useRafFn } from "@usels/core";

useRafFn(
  ({ timestamp }) => {
    console.log("ran once at", timestamp);
  },
  { once: true }
);
```

> **Note:** `once: true` means "pause after the first frame **per resume cycle**". Calling `resume()` again starts a new cycle.

## Notes

### `delta` on the first frame

`delta` is always `0` on the first frame after `resume()`. This avoids a production pitfall where the `DOMHighResTimeStamp` accumulates from page load (potentially thousands of ms), causing physics simulations to jump on the first frame.

### `fpsLimit` valid values

Only positive finite numbers limit the frame rate. All other values behave as **unlimited**:

| `fpsLimit`       | Behavior                  |
| ---------------- | ------------------------- |
| `null` (default) | Unlimited                 |
| `60`             | Capped at 60 fps          |
| `0`              | Unlimited (not "stopped") |
| `NaN`            | Unlimited                 |
| `Infinity`       | Unlimited                 |
| negative         | Unlimited                 |

To stop the loop, use `pause()` instead of setting `fpsLimit` to a non-positive value.

### Reactive `fpsLimit`

Pass an `Observable` when you need to change the fps cap at runtime. A plain `number` is captured at mount time and **will not update** if the component re-renders with a new value (stale closure):

```tsx twoslash
// @noErrors
import { useRafFn } from "@usels/core";
import { observable } from "@legendapp/state";

// ✅ Reactive — changes apply on the next frame
const fps$ = observable(30);
useRafFn(fn, { fpsLimit: fps$ });
fps$.set(60); // takes effect immediately

// ❌ Stale closure — re-render with a new number has no effect
const [fps, setFps] = useState(30);
useRafFn(fn, { fpsLimit: fps }); // captures 30 at mount, never updates
```
