# useElementSize

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the width and height of a DOM element using the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver). Returns reactive `Observable<number>` values that update whenever the element resizes. SVG elements use `getBoundingClientRect()` as a fallback. Supports all three box models.

## Usage

```tsx
import { useRef$, useElementSize } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { width$, height$ } = useElementSize(el$);

  return (
    <div ref={el$}>
      {width$.get()} × {height$.get()}
    </div>
  );
}
```

### Custom initial size

```tsx
import { useRef$, Ref$, useElementSize } from "@usels/core";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { width$, height$ } = useElementSize(el$, { width: 320, height: 240 });
```

### With `border-box`

```tsx
import { useRef$, Ref$, useElementSize } from "@usels/core";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { width$, height$ } = useElementSize(el$, undefined, { box: "border-box" });
```

### Stopping observation manually

```tsx
import { useRef$, Ref$, useElementSize } from "@usels/core";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { width$, height$, stop } = useElementSize(el$);

stop();
```

## Type Declarations

```typescript
export interface UseElementSizeOptions {
    box?: "content-box" | "border-box" | "device-pixel-content-box";
}
export interface UseElementSizeReturn {
    width$: Observable<number>;
    height$: Observable<number>;
    stop: () => void;
}
export declare function useElementSize(target: MaybeEventTarget, initialSize?: {
    width: number;
    height: number;
}, options?: UseElementSizeOptions): UseElementSizeReturn;
```

## Source

- Implementation: `packages/web/src/elements/useElementSize/index.ts`
- Documentation: `packages/web/src/elements/useElementSize/index.md`