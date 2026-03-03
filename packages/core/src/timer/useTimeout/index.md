---
title: useTimeout
description: Reactive boolean that becomes true after a given delay
category: Timer
---

A thin wrapper around `useTimeoutFn` that exposes a `ReadonlyObservable<boolean>` (`ready$`) that flips to `true` when the timeout completes.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useTimeout } from "@usels/core";

const ready$ = useTimeout(1000);
// ready$.get() === false while waiting
// ready$.get() === true after 1000ms
```

### With callback

```tsx twoslash
// @noErrors
import { useTimeout } from "@usels/core";

useTimeout(500, {
  callback: () => console.log("done!"),
});
```

### With stop/start controls

```tsx twoslash
// @noErrors
import { useTimeout } from "@usels/core";

const { ready$, isPending$, stop, start } = useTimeout(1000, { controls: true });

stop(); // cancel the pending timeout
start(); // restart the timer
```

### Manual start (`immediate: false`)

```tsx twoslash
// @noErrors
import { useTimeout } from "@usels/core";

const { ready$, start } = useTimeout(1000, {
  controls: true,
  immediate: false,
});

// call start() when you're ready
start();
```

## Notes

### `ready$` vs `isPending$`

| Observable                   | Meaning                               |
| ---------------------------- | ------------------------------------- |
| `ready$`                     | `true` when timeout has fired         |
| `isPending$` (controls only) | `true` while timeout is still waiting |

They are inverses: `ready$ = !isPending$`.

### Reactive `interval`

Pass an `Observable<number>` as the first argument and `useTimeoutFn` will read the latest value each time `start()` is called.
