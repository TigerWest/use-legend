---
title: usePreferredLanguages
category: browser
---

Reactive browser languages. Returns a `ReadonlyObservable<readonly string[]>` tracking the user's preferred languages via `navigator.languages`, updating on the `languagechange` event.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePreferredLanguages } from "@usels/web";

function Component() {
  const languages$ = usePreferredLanguages();

  return <p>Languages: {languages$.get().join(", ")}</p>;
}
```
