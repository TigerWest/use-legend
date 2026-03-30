---
title: usePointer
category: Sensors
sidebar:
  order: 3
---

Reactive pointer state tracking. Monitors `pointerdown`, `pointermove`, `pointerup`, and `pointerleave` events, exposing position, pressure, tilt, dimensions, twist, pointer type, and inside state as observables.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePointer } from "@usels/web";

function PointerTracker() {
  const { x$, y$, pressure$, pointerType$, isInside$ } = usePointer();

  return (
    <div>
      <p>
        Position: ({x$.get()}, {y$.get()})
      </p>
      <p>Pressure: {pressure$.get()}</p>
      <p>Type: {pointerType$.get()}</p>
      <p>Inside: {isInside$.get() ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Filter by pointer type

```tsx twoslash
// @noErrors
import { usePointer } from "@usels/web";

function PenOnly() {
  const { x$, y$, pressure$ } = usePointer({
    pointerTypes: ["pen"],
  });

  return (
    <p>
      Pen at ({x$.get()}, {y$.get()}) pressure: {pressure$.get()}
    </p>
  );
}
```

### Custom target

```tsx twoslash
// @noErrors
import { usePointer } from "@usels/web";
import { useRef$ } from "@usels/core";

function AreaTracker() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$, isInside$ } = usePointer({ target: el$ });

  return (
    <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
      {isInside$.get() ? `(${x$.get()}, ${y$.get()})` : "Move pointer here"}
    </div>
  );
}
```
