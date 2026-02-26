---
title: useScroll
category: sensors
---

Tracks the scroll position, scroll direction, arrived state (top/bottom/left/right), and scrolling status of any scrollable target — `HTMLElement`, `Document`, or `Window` — as reactive `Observable` values.

## Demo

## Usage

### Basic — HTMLElement

```tsx twoslash
// @noErrors
import { useScroll, useEl$ } from '@usels/core'
import { Computed } from '@legendapp/state/react'

function Component() {
  const el$ = useEl$<HTMLDivElement>()
  const { x, y, arrivedState } = useScroll(el$)

  return (
    <div ref={el$} style={{ overflow: 'auto', height: 300 }}>
      <Computed>
        {() => (
          <p>
            scrollX: {x.get()}, scrollY: {y.get()}
            {arrivedState.bottom.get() && ' — reached bottom'}
          </p>
        )}
      </Computed>
    </div>
  )
}
```

### Window scroll

Use `useWindowScroll` for the common case, or pass `window` directly.

```tsx
import { useScroll } from '@usels/core'

function Component() {
  const { y, arrivedState, isScrolling } = useScroll(window)
}
```

### Scroll direction

```tsx
import { useScroll, useEl$ } from '@usels/core'

function Component() {
  const el$ = useEl$<HTMLDivElement>()
  const { directions } = useScroll(el$)

  // directions.bottom.get() → true while scrolling down
  // directions.top.get()    → true while scrolling up
}
```

### Arrived state with offset

Use `offset` to declare a threshold (in px) before the edge is considered "arrived".

```typescript
const { arrivedState } = useScroll(el$, {
  offset: { bottom: 100 }, // bottom=true when within 100px of the end
})
```

### isScrolling + onStop

```typescript
const { isScrolling } = useScroll(el$, {
  idle: 300,           // ms to wait before isScrolling becomes false (default: 200)
  onStop: () => {
    // called when scrolling stops
  },
})
```

### Throttle

```typescript
const { x, y } = useScroll(el$, { throttle: 50 }) // handler fires at most once per 50ms
```

### Manual re-measure

```typescript
const { y, measure } = useScroll(el$)

// Call measure() to force-sync scroll state without a scroll event
measure()
```

### Null / SSR-safe target

Passing `null` is safe — all observables stay at their initial values and no event listener is registered.

```tsx
import { useScroll } from '@usels/core'

const target = typeof window !== 'undefined' ? document : null
const { y } = useScroll(target)
```

## Notes

**Reactive observables, not state.** All returned values (`x`, `y`, `isScrolling`, `arrivedState`, `directions`) are Legend-State `Observable`s. Read them with `.get()` inside a reactive context (`Computed`, `useObserve`, etc.) to avoid unnecessary re-renders.

**`measure()` is synchronous.** It immediately reads the current scroll values from the DOM and updates all observables. Useful after programmatic scroll operations.

**`arrivedState` initial values.** On mount, `top` and `left` default to `true`, and `bottom`/`right` default to `false`. After the first `measure()` call (triggered automatically on mount), all values are synced with actual DOM state.
