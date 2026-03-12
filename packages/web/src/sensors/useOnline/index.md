---
title: useOnline
category: Sensors
---

Reactive online state. A thin wrapper around [`useNetwork`](/web/sensors/useNetwork) that returns only the `isOnline$` Observable.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useOnline } from "@usels/web";

function Component() {
  const isOnline$ = useOnline();

  return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
}
```

### With `onChange` callback

Use `onChange` on the returned Observable to react to network status changes.

```tsx twoslash
// @noErrors
import { useMount } from "@legendapp/state/react";
import { useOnline } from "@usels/web";

function Component() {
  const isOnline$ = useOnline();

  useMount(() => {
    return isOnline$.onChange(({ value }) => {
      console.log(value ? "Back online" : "Gone offline");
    });
  });

  return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
}
```
