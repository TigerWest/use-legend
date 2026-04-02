---
title: useMousePressed
description: "Tracks mouse/touch press state reactively. Returns an observable boolean for the pressed state and the source type that triggered it."
category: Sensors
sidebar:
  order: 2
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useMousePressed } from "@usels/web";

function Component() {
  const { pressed$, sourceType$ } = useMousePressed();

  return (
    <div>
      {pressed$.get() ? "Pressed" : "Released"} — {sourceType$.get() ?? "none"}
    </div>
  );
}
```

### With target element

By default events are listened on `window`. Pass any element via `target` to scope tracking to that element.

```tsx
// @noErrors
import { useRef$ } from "@usels/core";
import { useMousePressed } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { pressed$ } = useMousePressed({ target: el$ });

  return (
    <div ref={el$} style={{ background: pressed$.get() ? "blue" : "gray" }}>
      Press me
    </div>
  );
}
```

### Touch support

Touch tracking is enabled by default. Use `touch: false` to disable it.

```tsx
// @noErrors
import { useMousePressed } from "@usels/web";
// ---cut---
// Disable touch tracking
const { pressed$ } = useMousePressed({ touch: false });
```

### Callbacks (onPressed / onReleased)

Use `onPressed` and `onReleased` callbacks to react to press events without subscribing to observables.

```tsx
// @noErrors
import { useMousePressed } from "@usels/web";
// ---cut---
const { pressed$ } = useMousePressed({
  onPressed: (e) => console.log("pressed", e),
  onReleased: (e) => console.log("released", e),
});
```

### Prevent drag

Set `preventDragEvent: true` to prevent the default drag behavior while pressing.

```tsx
// @noErrors
import { useMousePressed } from "@usels/web";
// ---cut---
const { pressed$ } = useMousePressed({ preventDragEvent: true });
```

### Combined with useMouse

Use `useMousePressed` alongside `useMouse` to track both cursor position and press state simultaneously.

```tsx
// @noErrors
import { useRef$ } from "@usels/core";
import { useMouse, useMousePressed } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$ } = useMouse({ target: el$ });
  const { pressed$, sourceType$ } = useMousePressed({ target: el$ });

  return (
    <div ref={el$}>
      Position: {x$.get()}, {y$.get()}
      <br />
      Pressed: {String(pressed$.get())} ({sourceType$.get() ?? "none"})
    </div>
  );
}
```
