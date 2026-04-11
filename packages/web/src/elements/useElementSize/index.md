---
title: useElementSize
description: "Tracks the width and height of a DOM element using the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver). Returns reactive `Observable<number>` values that update whenever the element resizes. SVG elements use `getBoundingClientRect()` as a fallback. Supports all three box models."
category: Elements
---

## Demo

## Usage

```tsx twoslash
// @noErrors
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
// @noErrors
import { useRef$, Ref$, useElementSize } from "@usels/core";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { width$, height$ } = useElementSize(el$, { width: 320, height: 240 });
```

### With `border-box`

```tsx
// @noErrors
import { useRef$, Ref$, useElementSize } from "@usels/core";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { width$, height$ } = useElementSize(el$, undefined, { box: "border-box" });
```

### Stopping observation manually

```tsx
// @noErrors
import { useRef$, Ref$, useElementSize } from "@usels/core";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { width$, height$, stop } = useElementSize(el$);

stop();
```
