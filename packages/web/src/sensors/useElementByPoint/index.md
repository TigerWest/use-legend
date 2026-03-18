---
title: useElementByPoint
category: Sensors
---

Reactively tracks the DOM element at specified x/y coordinates using `document.elementFromPoint()`. Uses `requestAnimationFrame` for continuous polling and supports both single and multiple element detection modes. Includes pausable controls.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useElementByPoint } from "@usels/web";

function ElementTracker() {
  const { element$, isActive$, pause, resume } = useElementByPoint({
    x: 100,
    y: 200,
  });

  return (
    <div>
      <p>Element: {element$.get()?.tagName ?? "none"}</p>
      <p>Active: {isActive$.get() ? "Yes" : "No"}</p>
      <button onClick={isActive$.get() ? pause : resume}>
        {isActive$.get() ? "Pause" : "Resume"}
      </button>
    </div>
  );
}
```

### Multiple Elements

```tsx twoslash
// @noErrors
import { useElementByPoint } from "@usels/web";

// Returns all elements at the point (uses elementsFromPoint)
const { element$ } = useElementByPoint({
  x: () => mouseX,
  y: () => mouseY,
  multiple: true,
});
// element$.get() is Element[]
```
