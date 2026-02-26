---
title: useElementSize
category: elements
---

Tracks the width and height of a DOM element using the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).
Returns reactive `Observable<number>` values that update whenever the element resizes.
SVG elements use `getBoundingClientRect()` as a fallback. Supports all three box models.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useEl$, useElementSize } from '@usels/core'
import { Computed } from '@legendapp/state/react'

function Component() {
  const el$ = useEl$<HTMLDivElement>()
  const { width, height } = useElementSize(el$)

  return (
    <Computed>
      {() => (
        <div ref={el$}>
          {width.get()} × {height.get()}
        </div>
      )}
    </Computed>
  )
}
```

### Custom initial size

```tsx twoslash
// @noErrors
import { useEl$, useElementSize } from '@usels/core'

const el$ = useEl$<HTMLDivElement>()
const { width, height } = useElementSize(el$, { width: 320, height: 240 })
```

### With `border-box`

```tsx twoslash
// @noErrors
import { useEl$, useElementSize } from '@usels/core'

const el$ = useEl$<HTMLDivElement>()
const { width, height } = useElementSize(el$, undefined, { box: 'border-box' })
```

### Stopping observation manually

```tsx twoslash
// @noErrors
import { useEl$, useElementSize } from '@usels/core'

const el$ = useEl$<HTMLDivElement>()
const { width, height, stop } = useElementSize(el$)

stop()
```