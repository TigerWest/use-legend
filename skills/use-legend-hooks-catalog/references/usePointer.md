# usePointer

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive pointer state tracking. Monitors `pointerdown`, `pointermove`, `pointerup`, and `pointerleave` events, exposing position, pressure, tilt, dimensions, twist, pointer type, and inside state as observables.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePointer } from "@usels/web";

    function PointerTracker() {
      const { x$, y$, pressure$, pointerType$, isInside$ } = usePointer();

      return (
        <div>
          <p>Position: ({x$.get()}, {y$.get()})</p>
          <p>Pressure: {pressure$.get()}</p>
          <p>Type: {pointerType$.get()}</p>
          <p>Inside: {isInside$.get() ? "Yes" : "No"}</p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPointer } from "@usels/web";

    function PointerTracker() {
      "use scope"
      const { x$, y$, pressure$, pointerType$, isInside$ } = createPointer();

      return (
        <div>
          <p>Position: ({x$.get()}, {y$.get()})</p>
          <p>Pressure: {pressure$.get()}</p>
          <p>Type: {pointerType$.get()}</p>
          <p>Inside: {isInside$.get() ? "Yes" : "No"}</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Filter by pointer type

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { usePointer } from "@usels/web";

    function PenOnly() {
      const { x$, y$, pressure$ } = usePointer({ pointerTypes: ["pen"] });

      return (
        <p>
          Pen at ({x$.get()}, {y$.get()}) pressure: {pressure$.get()}
        </p>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPointer } from "@usels/web";

    function PenOnly() {
      "use scope"
      const { x$, y$, pressure$ } = createPointer({ pointerTypes: ["pen"] });

      return (
        <p>
          Pen at ({x$.get()}, {y$.get()}) pressure: {pressure$.get()}
        </p>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Custom target

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$ } from "@usels/core";
    import { usePointer } from "@usels/web";

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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createPointer } from "@usels/web";

    function AreaTracker() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const { x$, y$, isInside$ } = createPointer({ target: el$ });

      return (
        <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
          {isInside$.get() ? `(${x$.get()}, ${y$.get()})` : "Move pointer here"}
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPointer } from "./core";
export type { UsePointerType, UsePointerOptions, UsePointerReturn } from "./core";
export type UsePointer = typeof createPointer;
export declare const usePointer: UsePointer;
```

## Source

- Implementation: `packages/web/src/sensors/usePointer/index.ts`
- Documentation: `packages/web/src/sensors/usePointer/index.mdx`