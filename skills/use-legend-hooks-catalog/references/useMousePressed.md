# useMousePressed

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks mouse/touch press state reactively. Returns an observable boolean for the pressed state and the source type that triggered it.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createMousePressed } from "@usels/web";

    function Component() {
      "use scope"
      const { pressed$, sourceType$ } = createMousePressed();

      return (
        <div>
          {pressed$.get() ? "Pressed" : "Released"} — {sourceType$.get() ?? "none"}
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### With target element

By default events are listened on `window`. Pass any element via `target` to scope tracking to that element.

```tsx
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
import { useMousePressed } from "@usels/web";
// ---cut---
// Disable touch tracking
const { pressed$ } = useMousePressed({ touch: false });
```

### Callbacks (onPressed / onReleased)

Use `onPressed` and `onReleased` callbacks to react to press events without subscribing to observables.

```tsx
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
import { useMousePressed } from "@usels/web";
// ---cut---
const { pressed$ } = useMousePressed({ preventDragEvent: true });
```

### Combined with useMouse

Use `useMousePressed` alongside `useMouse` to track both cursor position and press state simultaneously.

```tsx
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

## Type Declarations

```typescript
export { createMousePressed } from "./core";
export type { UseMousePressedSourceType, UseMousePressedOptions, UseMousePressedReturn, } from "./core";
export type UseMousePressed = typeof createMousePressed;
export declare const useMousePressed: UseMousePressed;
```

## Source

- Implementation: `packages/web/src/sensors/useMousePressed/index.ts`
- Documentation: `packages/web/src/sensors/useMousePressed/index.mdx`