---
title: useWindowScroll
category: sensors
---

Tracks the window scroll position, direction, arrived state, and scrolling status as reactive `Observable` values. A convenience wrapper around `useScroll(window)`.

## Demo

## Usage

### Basic

```tsx twoslash
// @noErrors
import { useWindowScroll } from '@usels/core'

function Component() {
  const { x, y, arrivedState } = useWindowScroll()

  return (
    <p>
      scrollX: {x.get()}, scrollY: {y.get()}
      {arrivedState.bottom.get() && ' — reached bottom'}
    </p>
  )
}
```

### Back-to-top button

```tsx twoslash
// @noErrors
import { useWindowScroll } from '@usels/core'

function BackToTop() {
  const { arrivedState } = useWindowScroll()

  return (
    !arrivedState.top.get() ? (
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        ↑ Back to top
      </button>
    ) : null
  )
}
```

### Scroll direction indicator

```tsx
const { directions } = useWindowScroll()
// directions.bottom.get() → true while scrolling down
// directions.top.get()    → true while scrolling up
```

### Infinite scroll trigger

```typescript
import { useObserveEffect } from '@legendapp/state/react'

const { arrivedState } = useWindowScroll({ offset: { bottom: 200 } })

useObserveEffect(arrivedState.bottom, (e) => {
  if (e.value) fetchNextPage()
})
```

### isScrolling + onStop

```typescript
const { isScrolling } = useWindowScroll({
  idle: 300,
  onStop: () => saveScrollPosition(),
})
```

### Throttled updates

```typescript
const { y } = useWindowScroll({ throttle: 100 })
```

## Notes

**SSR-safe.** When `window` is not available (SSR), `useWindowScroll` passes `null` to `useScroll`, so all observables hold initial values (`x: 0`, `y: 0`, `isScrolling: false`) and no event listener is registered.

See [`useScroll`](/sensors/use-scroll) for the full API reference including all options.
