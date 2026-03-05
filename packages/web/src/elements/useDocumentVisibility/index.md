---
title: useDocumentVisibility
category: elements
---

Tracks the browser tab's visibility state (`'visible'` or `'hidden'`) as a reactive `Observable<DocumentVisibilityState>`.
Updates automatically when the user switches tabs or minimizes the window.
SSR-safe: returns `'visible'` when `document` is not available.

## Demo

## Usage

```tsx
import { useDocumentVisibility } from "@usels/core";

function Component() {
  const visibility$ = useDocumentVisibility();

  return <p>Tab is {visibility$.get()}</p>;
}
```

### Pausing work when the tab is hidden

```tsx
const visibility$ = useDocumentVisibility();

useObserve(() => {
  if (visibility$.get() === "hidden") pausePolling();
  else resumePolling();
});
```

### Tracking page view time

```tsx
const visibility$ = useDocumentVisibility();
const visibleSince = useObservable(Date.now());

useObserve(() => {
  if (visibility$.get() === "visible") {
    visibleSince.set(Date.now());
  } else {
    const elapsed = Date.now() - visibleSince.get();
    trackVisibleTime(elapsed);
  }
});
```
