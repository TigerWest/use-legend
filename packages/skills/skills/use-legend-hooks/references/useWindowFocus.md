# useWindowFocus

> Part of `@usels/web` | Category: Elements

## Overview

Tracks whether the browser window currently has focus as a reactive `Observable<boolean>`. Updates automatically when the user switches tabs, clicks away, or returns to the window. SSR-safe: returns `false` when `document` is not available.

## Usage

```tsx
import { useWindowFocus } from "@usels/core";

function Component() {
  const focused$ = useWindowFocus();

  return <p>Window is {focused$.get() ? "focused" : "blurred"}</p>;
}
```

### Pausing work when the window loses focus

```tsx
const focused$ = useWindowFocus();

useObserve(() => {
  if (!focused$.get()) pausePolling();
  else resumePolling();
});
```

## Type Declarations

```typescript
export declare function useWindowFocus(): Observable<boolean>;
```

## Source

- Implementation: `packages/web/src/elements/useWindowFocus/index.ts`
- Documentation: `packages/web/src/elements/useWindowFocus/index.md`