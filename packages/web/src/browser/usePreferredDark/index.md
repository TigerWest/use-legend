---
title: usePreferredDark
category: browser
---

Reactive dark theme preference. Returns `Observable<boolean>` that tracks whether the user prefers a dark color scheme via the `(prefers-color-scheme: dark)` media query.

A thin wrapper around [`useMediaQuery`](/web/browser/useMediaQuery).

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePreferredDark } from "@usels/web";

function Component() {
  const isDark$ = usePreferredDark();

  return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
}
```

### SSR with ssrWidth

```tsx twoslash
// @noErrors
import { usePreferredDark } from "@usels/web";

function Component() {
  const isDark$ = usePreferredDark({ ssrWidth: 1280 });

  return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
}
```
