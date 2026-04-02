# useMouse

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks the mouse/pointer cursor position reactively. Supports multiple coordinate systems (`page`, `client`, `screen`, `movement`) and optional touch event tracking.

## Usage

```tsx
import { useMouse } from "@usels/web";

function Component() {
  const { x$, y$, sourceType$ } = useMouse();

  return (
    <div>
      {x$.get()}, {y$.get()} — {sourceType$.get()}
    </div>
  );
}
```

### Coordinate types

The `type` option selects which coordinate system to use. It is read only at mount time.

```tsx
import { useMouse } from "@usels/web";
// ---cut---
// "page" (default) — relative to the document
const { x$, y$ } = useMouse({ type: "page" });

// "client" — relative to the viewport
const { x$: cx$, y$: cy$ } = useMouse({ type: "client" });

// "screen" — relative to the screen
const { x$: sx$, y$: sy$ } = useMouse({ type: "screen" });

// "movement" — delta movement since last event (MouseEvent.movementX/Y)
const { x$: mx$, y$: my$ } = useMouse({ type: "movement" });
```

### Touch support

Touch tracking is enabled by default. Use `touch: false` to disable it, or `resetOnTouchEnds: true` to reset coordinates back to the initial value when the finger lifts.

```tsx
import { useMouse } from "@usels/web";
// ---cut---
// Disable touch tracking
const { x$, y$ } = useMouse({ touch: false });

// Reset to origin on touchend
const { x$: rx$, y$: ry$ } = useMouse({ resetOnTouchEnds: true });
```

### Custom target

By default events are listened on `window`. Pass any element (or an `Observable` wrapping one) via `target` to scope tracking to that element.

```tsx
import { useRef$ } from "@usels/core";
import { useMouse } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$ } = useMouse({ target: el$ });

  return (
    <div ref={el$}>
      {x$.get()}, {y$.get()}
    </div>
  );
}
```

### With useMouseInElement combination

Use `useMouse` for global coordinates while `useMouseInElement` provides element-relative coordinates at the same time.

```tsx
import { useRef$ } from "@usels/core";
import { useMouse, useMouseInElement } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$ } = useMouse();
  const { elementX$, elementY$, isOutside$ } = useMouseInElement(el$);

  return (
    <div ref={el$}>
      Global: {x$.get()}, {y$.get()}
      <br />
      Local: {elementX$.get()}, {elementY$.get()} (outside: {String(isOutside$.get())})
    </div>
  );
}
```

## Type Declarations

```typescript
export type UseMouseCoordType = "page" | "client" | "screen" | "movement";
export type UseMouseSourceType = "mouse" | "touch" | null;
export interface UseMouseOptions extends ConfigurableEventFilter, ConfigurableWindow {
    type?: UseMouseCoordType;
    touch?: boolean;
    resetOnTouchEnds?: boolean;
    target?: MaybeElement;
    initialValue?: {
        x: number;
        y: number;
    };
}
export interface UseMouseReturn {
    x$: ReadonlyObservable<number>;
    y$: ReadonlyObservable<number>;
    sourceType$: ReadonlyObservable<UseMouseSourceType>;
}
export declare function useMouse(options?: DeepMaybeObservable<UseMouseOptions>): UseMouseReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useMouse/index.ts`
- Documentation: `packages/web/src/sensors/useMouse/index.md`