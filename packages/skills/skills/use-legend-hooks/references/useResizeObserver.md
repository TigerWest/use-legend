# useResizeObserver

> Part of `@usels/web` | Category: Elements

## Overview

Observes one or more elements for size changes using the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver). Targets can be `Ref, `MaybeElement`, or a plain `Element`.

## Usage

```tsx
import { useCallback } from "react";
import { useRef$, useResizeObserver } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  const handleResize = useCallback<ResizeObserverCallback>((entries) => {
    const { width, height } = entries[0].contentRect;
    console.log(width, height);
  }, []);

  useResizeObserver(el$, handleResize);

  return <div ref={el$} />;
}
```

### With `border-box`

```tsx
useResizeObserver(el$, handleResize, { box: "border-box" });
```

### Stopping observation manually

```tsx
const { stop } = useResizeObserver(el$, handleResize);

stop();
```

### Checking browser support

```tsx
const { isSupported$ } = useResizeObserver(el$, handleResize);

console.log(isSupported$.get()); // Observable<boolean>
```

## Type Declarations

```typescript
export { normalizeTargets } from "@shared/normalizeTargets";
export interface UseResizeObserverOptions {
    box?: "content-box" | "border-box" | "device-pixel-content-box";
}
export interface UseResizeObserverReturn extends Supportable {
    stop: () => void;
}
export declare function useResizeObserver(target: MaybeEventTarget | MaybeEventTarget[], callback: ResizeObserverCallback, options?: UseResizeObserverOptions): UseResizeObserverReturn;
```

## Source

- Implementation: `packages/web/src/elements/useResizeObserver/index.ts`
- Documentation: `packages/web/src/elements/useResizeObserver/index.md`