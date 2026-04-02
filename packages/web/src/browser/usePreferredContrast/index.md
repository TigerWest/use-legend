---
title: usePreferredContrast
description: "Reactive contrast preference. Returns a `ReadonlyObservable` tracking the user's preferred contrast level (`'more'`, `'less'`, `'custom'`, or `'no-preference'`) via `prefers-contrast` media queries."
category: browser
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePreferredContrast } from "@usels/web";

function Component() {
  const contrast$ = usePreferredContrast();

  return <p>Contrast: {contrast$.get()}</p>;
}
```
