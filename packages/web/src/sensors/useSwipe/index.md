---
title: useSwipe
description: "Reactive swipe detection based on TouchEvents. Detects swipe direction and length."
category: Sensors
sidebar:
  order: 3
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useSwipe } from "@usels/web";
import { useRef$ } from "@usels/core";

function SwipeDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const { isSwiping$, direction$, lengthX$, lengthY$ } = useSwipe(el$, {
    threshold: 50,
    onSwipeEnd: (e, dir) => console.log(`Swiped ${dir}`),
  });

  return (
    <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
      <p>Swiping: {isSwiping$.get() ? "yes" : "no"}</p>
      <p>Direction: {direction$.get()}</p>
      <p>
        Length: {lengthX$.get()}, {lengthY$.get()}
      </p>
    </div>
  );
}
```

### Reactive options

```typescript
import { observable } from "@legendapp/state";

const threshold$ = observable(50);
const { direction$ } = useSwipe(el$, { threshold: threshold$ });

// Later: adjust threshold reactively
threshold$.set(100);
```
