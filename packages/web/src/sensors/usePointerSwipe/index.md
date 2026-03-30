---
title: usePointerSwipe
category: Sensors
sidebar:
  order: 3
---

Reactive swipe detection based on PointerEvents. Detects swipe direction and distance.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePointerSwipe } from "@usels/web";
import { useRef$ } from "@usels/core";

function SwipeDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const { isSwiping$, direction$, distanceX$, distanceY$ } = usePointerSwipe(el$, {
    threshold: 50,
    onSwipeEnd: (e, dir) => console.log(`Swiped ${dir}`),
  });

  return (
    <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
      <p>Direction: {direction$.get()}</p>
      <p>
        Distance: {distanceX$.get()}, {distanceY$.get()}
      </p>
    </div>
  );
}
```

### Reactive options

```typescript
import { observable } from "@legendapp/state";

const threshold$ = observable(50);
const { direction$ } = usePointerSwipe(el$, { threshold: threshold$ });

// Later: adjust threshold reactively
threshold$.set(100);
```

## Notes

**`options` is `DeepMaybeObservable`.** Each option field can be a plain value or an `Observable`. Callback options (`onSwipeStart`, `onSwipe`, `onSwipeEnd`) are passed as plain functions.
