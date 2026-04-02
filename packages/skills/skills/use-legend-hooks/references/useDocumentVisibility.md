# useDocumentVisibility

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the browser tab's visibility state (`'visible'` or `'hidden'`) as a reactive `Observable<DocumentVisibilityState>`. Updates automatically when the user switches tabs or minimizes the window. SSR-safe: returns `'visible'` when `document` is not available.

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

## Type Declarations

```typescript
export declare function useDocumentVisibility(): Observable<DocumentVisibilityState>;
```

## Source

- Implementation: `packages/web/src/elements/useDocumentVisibility/index.ts`
- Documentation: `packages/web/src/elements/useDocumentVisibility/index.md`