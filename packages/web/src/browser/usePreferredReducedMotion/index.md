---
title: usePreferredReducedMotion
category: browser
---

Reactive reduced motion preference. Returns a `ReadonlyObservable` tracking the user's motion preference (`'reduce'` or `'no-preference'`) via the `prefers-reduced-motion` media query.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePreferredReducedMotion } from "@usels/web";

function Component() {
  const motion$ = usePreferredReducedMotion();

  return <p>Motion: {motion$.get()}</p>;
}
```
