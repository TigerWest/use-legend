---
title: useAutoReset
description: "Observable that automatically resets to a default value after a specified delay. Useful for temporary state like toast messages, form feedback, or UI status indicators. Each time the value changes, the reset timer restarts."
category: Reactivity
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useAutoReset } from "@usels/core";

const message$ = useAutoReset("", 2000);
message$.set("Saved!");
// message$.get() returns "Saved!" immediately
// After 2 seconds, message$.get() returns "" automatically
```

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useAutoReset } from "@usels/core";

// Reactive delay — changing afterMs$ restarts the pending timer
const afterMs$ = useObservable(1000);
const status$ = useAutoReset("idle", afterMs$);

status$.set("loading");
// Resets to "idle" after 1000ms
// Changing afterMs$.set(3000) restarts the timer with the new delay
```

### Boolean flag auto-reset

```tsx
// @noErrors
import { useAutoReset } from "@usels/core";

// Useful for brief UI feedback
const showCopied$ = useAutoReset(false, 1500);

const handleCopy = () => {
  navigator.clipboard.writeText("text");
  showCopied$.set(true);
  // Automatically resets to false after 1.5s
};
```
