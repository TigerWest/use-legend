---
title: useThrottleFn
description: "Throttle execution of a function. Especially useful for rate limiting execution of handlers on events like resize and scroll."
category: Utilities
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useThrottleFn } from "@usels/core";

const throttledFn = useThrottleFn((value: string) => {
  console.log(value);
}, 250);
```

With reactive delay:

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottleFn } from "@usels/core";

const delay$ = useObservable(300);
const throttledFn = useThrottleFn(() => {
  // ...
}, delay$);
// Changing delay$ applies the new interval from the next call
```

### Leading edge only

```tsx
// @noErrors
import { useThrottleFn } from "@usels/core";

// Fires immediately on first call, suppresses all subsequent calls within interval
const throttledFn = useThrottleFn(
  () => {
    // ...
  },
  300,
  { edges: ["leading"] }
);
```

### Trailing edge only

```tsx
// @noErrors
import { useThrottleFn } from "@usels/core";

// Does not fire immediately — fires once after the interval ends
const throttledFn = useThrottleFn(
  () => {
    // ...
  },
  300,
  { edges: ["trailing"] }
);
```
