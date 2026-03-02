---
title: useFps
description: Reactive frames-per-second counter using requestAnimationFrame
category: Animation
---

Returns a `ReadonlyObservable<number>` that tracks the current frames-per-second, sampled every N frames to reduce noise.

## Usage

```tsx twoslash
// @noErrors
import { useFps } from "@usels/core";

const fps = useFps();
// fps.get() → current FPS (0 until first sample)
```

### Custom sampling rate

```tsx twoslash
// @noErrors
import { useFps } from "@usels/core";

const fps = useFps({ every: 20 }); // sample every 20 frames (~333ms at 60fps)
```

## Notes

### Initial value

`fps` starts at `0` and updates only after the first `every` frames have elapsed.

### Sampling formula

```
fps = round(1000 / (elapsed_ms / frame_count))
```

At 60fps with `every=10`, each sample covers ~166ms and yields ~60.

### `every` is mount-time-only

The sampling period is fixed at mount. Changing `every` dynamically has no effect.
