---
title: useElementHover
category: Sensors
sidebar:
  order: 2
---

Reactively tracks whether a DOM element is being hovered. Supports optional enter/leave delays for debounced hover behavior.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useElementHover } from "@usels/web";
import { useRef$ } from "@usels/core";

function HoverTracker() {
  const el$ = useRef$<HTMLDivElement>();
  const isHovered$ = useElementHover(el$);

  return <div ref={el$}>{isHovered$.get() ? "Hovered!" : "Hover me"}</div>;
}
```

### With Delay

```tsx
// @noErrors
import { useElementHover } from "@usels/web";
import { useRef$ } from "@usels/core";

function DelayedHover() {
  const el$ = useRef$<HTMLDivElement>();
  const isHovered$ = useElementHover(el$, {
    delayEnter: 200,
    delayLeave: 300,
  });

  return <div ref={el$}>{isHovered$.get() ? "Hovered (with delay)" : "Hover me"}</div>;
}
```

### Reactive options

```typescript
import { observable } from "@legendapp/state";

const delayEnter$ = observable(200);
const isHovered$ = useElementHover(el$, { delayEnter: delayEnter$ });

// Later: update delay reactively
delayEnter$.set(500);
```

## Notes

**`options` is `DeepMaybeObservable`.** Each option field (`delayEnter`, `delayLeave`) can be a plain value or an `Observable`. Changes are picked up reactively at each hover toggle.
