---
title: useWindowFocus
category: elements
---

Tracks whether the browser window currently has focus as a reactive `Observable<boolean>`.
Updates automatically when the user switches tabs, clicks away, or returns to the window.
SSR-safe: returns `false` when `document` is not available.

## Demo

## Usage

```tsx
import { useWindowFocus } from '@usels/core'

function Component() {
  const focused$ = useWindowFocus()

  return (
    <p>Window is {focused$.get() ? 'focused' : 'blurred'}</p>
  )
}
```

### Pausing work when the window loses focus

```tsx
const focused$ = useWindowFocus()

useObserve(() => {
  if (!focused$.get()) pausePolling()
  else resumePolling()
})
```
