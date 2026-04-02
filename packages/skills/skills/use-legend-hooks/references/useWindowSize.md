# useWindowSize

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the browser window dimensions as reactive `Observable<number>` values for width and height. Supports `inner`, `outer`, and `visual` viewport modes, and updates on resize and orientation change. SSR-safe: returns `initialWidth`/`initialHeight` (default `0`) when `window` is not available.

## Usage

```tsx
import { useWindowSize } from "@usels/core";

function Component() {
  const size$ = useWindowSize();

  return (
    <p>
      {size$.width.get()} × {size$.height.get()}
    </p>
  );
}
```

### Excluding scrollbar width

```tsx
const size$ = useWindowSize({ includeScrollbar: false });
```

### Outer window size

```tsx
const size$ = useWindowSize({ type: "outer" });
```

### Visual viewport (pinch-zoom aware)

```tsx
const size$ = useWindowSize({ type: "visual" });
```

### Custom initial size for SSR

```tsx
const size$ = useWindowSize({ initialWidth: 1280, initialHeight: 800 });
```

## Type Declarations

```typescript
export interface UseWindowSizeOptions extends ConfigurableWindow {
    initialWidth?: number;
    initialHeight?: number;
    listenOrientation?: boolean;
    includeScrollbar?: boolean;
    type?: "inner" | "outer" | "visual";
}
export type UseWindowSizeReturn = Observable<{
    width: number;
    height: number;
}>;
export declare function useWindowSize(options?: DeepMaybeObservable<UseWindowSizeOptions>): UseWindowSizeReturn;
```

## Source

- Implementation: `packages/web/src/elements/useWindowSize/index.ts`
- Documentation: `packages/web/src/elements/useWindowSize/index.md`