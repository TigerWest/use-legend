---
title: useTimeoutFn
description: Reactive wrapper for setTimeout with start/stop control
category: Animation
---

Execute a function after a given delay with reactive `isPending` state and manual start/stop control.
Returns a `Stoppable` — `isPending` is an `Observable<boolean>` you can subscribe to.

## Usage

```tsx twoslash
// @noErrors
import { useTimeoutFn } from "@usels/core";

const { isPending, start, stop } = useTimeoutFn(() => {
  console.log("fired!");
}, 1000);

// isPending.get() === true while waiting
// stop() cancels the pending timeout
// start() restarts the timer (resets if already pending)
```

### Manual start (`immediate: false`)

```tsx twoslash
// @noErrors
import { useTimeoutFn } from "@usels/core";

const { isPending, start } = useTimeoutFn(() => console.log("done"), 500, { immediate: false });

// call start() manually when ready
start();
```

### Reactive interval (`MaybeObservable`)

```tsx twoslash
// @noErrors
import { useTimeoutFn } from "@usels/core";
import { observable } from "@legendapp/state";

const delay$ = observable(1000);
const { start } = useTimeoutFn(() => {}, delay$);
// start() always reads current value of delay$
```
