---
title: useLastChanged
description: "A hook that tracks when a source Observable last changed. Returns a read-only Observable containing the `Date.now()` timestamp of the most recent change, or `null` if the source has not changed yet."
category: Reactivity
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useLastChanged } from "@usels/core";

const count$ = useObservable(0);
const lastChanged$ = useLastChanged(count$);

lastChanged$.get(); // null (no change yet)

count$.set(1);
lastChanged$.get(); // 1715000000000 (Date.now() at time of change)
```

### initialValue — custom initial timestamp

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useLastChanged } from "@usels/core";

const count$ = useObservable(0);

// Start with a known timestamp instead of null
const lastChanged$ = useLastChanged(count$, Date.now());
```

### Core function — framework-agnostic usage

```tsx
// @noErrors
import { observable } from "@legendapp/state";
import { createLastChanged } from "@usels/core";

const source$ = observable("hello");
const { timestamp$, dispose } = createLastChanged(source$);

source$.set("world");
timestamp$.get(); // Date.now() at time of change

dispose(); // stop tracking
```
