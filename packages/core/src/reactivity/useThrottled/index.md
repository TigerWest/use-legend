---
title: useThrottled
category: Reactivity
---

Throttle an Observable value. Creates a read-only Observable that updates
at most once per interval when the source value changes.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottled } from "@usels/core";

const source$ = useObservable("hello");
const throttled$ = useThrottled(source$, 300);
// throttled$.get() updates at most once per 300ms
```

With reactive delay:

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottled } from "@usels/core";

const source$ = useObservable(0);
const delay$ = useObservable(300);
const throttled$ = useThrottled(source$, delay$);
// Changing delay$ applies from the next throttle cycle
```

### Leading edge only

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottled } from "@usels/core";

const source$ = useObservable("hello");
// Updates immediately on change, suppresses further updates within interval
const throttled$ = useThrottled(source$, 300, { edges: ["leading"] });
```

### Trailing edge only

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useThrottled } from "@usels/core";

const source$ = useObservable("hello");
// Does not update immediately — updates once after the interval ends
const throttled$ = useThrottled(source$, 300, { edges: ["trailing"] });
```
