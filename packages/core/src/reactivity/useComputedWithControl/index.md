---
title: useComputedWithControl
category: Reactivity
---

Computed Observable with explicit source control and manual trigger.
Only recomputes when the declared source changes, providing fine-grained control
over when expensive computations run.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useComputedWithControl } from "@usels/core";

const counter$ = useObservable(1);
const { value$, trigger } = useComputedWithControl(counter$, (count) => count * 2);
// value$.get() === 2
// When counter$ changes → value$ recomputes automatically
```

### Manual trigger

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useComputedWithControl } from "@usels/core";

const source$ = useObservable(1);
const { value$, trigger } = useComputedWithControl(source$, (val) => {
  return val + Math.random(); // includes non-reactive data
});

// trigger() forces recomputation without waiting for source change
trigger();
```

### Previous value (incremental computation)

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useComputedWithControl } from "@usels/core";

const event$ = useObservable(0);
const { value$ } = useComputedWithControl(event$, (eventValue, prev) => (prev ?? 0) + eventValue);
// Each time event$ changes, the new value is added to the accumulated total
```

### Array source

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useComputedWithControl } from "@usels/core";

const width$ = useObservable(100);
const height$ = useObservable(50);
const { value$: area$ } = useComputedWithControl([width$, height$], ([w, h]) => w * h);
// area$.get() === 5000
// Recomputes when either width$ or height$ changes
```
