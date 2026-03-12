---
title: usePreferredColorScheme
category: browser
---

Reactive color scheme preference. Returns a `ReadonlyObservable` tracking the user's preferred color scheme (`'dark'`, `'light'`, or `'no-preference'`) via `prefers-color-scheme` media queries.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePreferredColorScheme } from "@usels/web";

function Component() {
  const scheme$ = usePreferredColorScheme();

  return <p>Preferred: {scheme$.get()}</p>;
}
```
