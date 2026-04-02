---
title: useDebounceFn
description: "Debounce execution of a function."
category: Utilities
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useDebounceFn } from "@usels/core";

const debouncedFn = useDebounceFn((value: string) => {
  console.log(value);
}, 250);
```

With reactive delay:

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useDebounceFn } from "@usels/core";

const delay$ = useObservable(300);
const debouncedFn = useDebounceFn(() => {
  // ...
}, delay$);
// Changing delay$ applies the new delay from the next call
```

With `maxWait`:

```tsx
// @noErrors
import { useDebounceFn } from "@usels/core";

// Forces execution every 1000ms even with continuous calls
const debouncedFn = useDebounceFn(
  () => {
    // ...
  },
  300,
  { maxWait: 1000 }
);
```
