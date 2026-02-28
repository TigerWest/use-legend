---
title: useIntersectionObserver
category: elements
---

Reactive wrapper around the [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).
Observes one or more elements for intersection changes with pause/resume/stop support.
Targets can be `Ref$`, `MaybeElement`, or a plain `Element`.

## Demo

## Usage

```tsx
import { useRef$, useIntersectionObserver } from '@usels/core'

function Component() {
  const el$ = useRef$<HTMLDivElement>()

  const { isActive, pause, resume } = useIntersectionObserver(
    el$,
    (entries) => {
      entries.forEach((entry) => {
        console.log(entry.isIntersecting)
      })
    },
    { threshold: 0.5 },
  )

  return <div ref={el$} />
}
```

### Threshold array

Trigger the callback at multiple intersection ratios:

```tsx
useIntersectionObserver(el$, callback, {
  threshold: [0, 0.25, 0.5, 0.75, 1],
})
```

### Custom root and rootMargin

```tsx
useIntersectionObserver(el$, callback, {
  root: scrollContainerEl,
  rootMargin: '0px 0px -100px 0px',
})
```

### Reactive root / rootMargin

Pass an `Observable` to reactively recreate the observer when the value changes:

```tsx
const rootMargin$ = observable('0px')

useIntersectionObserver(el$, callback, { rootMargin: rootMargin$ })

// later — observer is automatically recreated with new margin
rootMargin$.set('-50px 0px')
```

### Deferred start

Set `immediate: false` to start observation manually:

```tsx
const { resume } = useIntersectionObserver(el$, callback, { immediate: false })

resume() // starts observing
```

### Pause and resume

```tsx
const { pause, resume } = useIntersectionObserver(el$, callback)

pause()   // disconnects the observer, isActive → false
resume()  // reconnects the observer, isActive → true
```

### Permanent stop

```tsx
const { stop } = useIntersectionObserver(el$, callback)

stop() // disconnects and prevents future resume()
```

### Checking browser support

```tsx
const { isSupported } = useIntersectionObserver(el$, callback)

console.log(isSupported.get()) // Observable<boolean>
```
