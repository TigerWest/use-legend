---
title: useLocalStorage
description: "Reactive `localStorage` binding. Thin wrapper around `useStorage` with `ObservablePersistLocalStorage` as the persist plugin."
category: browser
---

See [useStorage](../useStorage/) for details and [Legend-State persist & sync](https://legendapp.com/open-source/state/v3/sync/persist-sync/) for advanced

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useLocalStorage } from "@usels/web";

function Component() {
  const count$ = useLocalStorage("count", 0);

  return <button onClick={() => count$.set(count$.get() + 1)}>Count: {count$.get()}</button>;
}
```
