---
title: usePreferredReducedTransparency
description: "Reactive reduced transparency preference. Returns a `ReadonlyObservable` tracking the user's transparency preference (`'reduce'` or `'no-preference'`) via the `prefers-reduced-transparency` media query."
category: Browser
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePreferredReducedTransparency } from "@usels/web";

function Component() {
  const transparency$ = usePreferredReducedTransparency();

  return <p>Transparency: {transparency$.get()}</p>;
}
```
