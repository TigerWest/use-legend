---
title: useElementBounding
category: elements
---

Tracks the bounding rect of a DOM element — `x`, `y`, `top`, `right`, `bottom`, `left`, `width`, `height` — as reactive `Observable<number>` values.
Uses [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) for size changes, [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) for `style`/`class` attribute changes, and `scroll`/`resize` window events for position changes.
`requestAnimationFrame` is used by default so CSS transform animations are captured accurately.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useRef$, useElementBounding } from '@usels/core'

function Component() {
  const el$ = useRef$<HTMLDivElement>()
  const { top, left, width, height } = useElementBounding(el$)

  return (
    <div ref={el$}>
      {width.get()} × {height.get()} at ({left.get()}, {top.get()})
    </div>
  )
}
```

### Manual update

```tsx twoslash
// @noErrors
import { useRef$, Ref$, useElementBounding } from '@usels/core'
declare const el$: Ref$<HTMLDivElement>
// ---cut---
const { top, left, update } = useElementBounding(el$)

// Force-recalculate bounding rect imperatively
update()
```

### Disable window scroll tracking

```typescript
const { top, left } = useElementBounding(el$, { windowScroll: false })
```

### Skip requestAnimationFrame (synchronous reads)

```typescript
const { width, height } = useElementBounding(el$, { useCssTransforms: false })
```

### Keep values on unmount (no reset)

```typescript
const { top } = useElementBounding(el$, { reset: false })
```
