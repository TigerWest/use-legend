---
title: useSessionStorage
description: "Reactive `sessionStorage` binding. Thin wrapper around `useStorage` with `ObservablePersistSessionStorage` as the persist plugin. Values persist only for the current browser session."
category: browser
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useSessionStorage } from "@usels/web";

function Component() {
  const step$ = useSessionStorage("wizard-step", 1);

  return (
    <div>
      <p>Step: {step$.get()}</p>
      <button onClick={() => step$.set(step$.get() + 1)}>Next</button>
    </div>
  );
}
```
