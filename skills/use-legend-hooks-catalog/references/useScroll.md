# useScroll

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks the scroll position, scroll direction, arrived state (top/bottom/left/right), and scrolling status of any scrollable target — `HTMLElement`, `Document`, or `Window` — as reactive `Observable` values.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useScroll } from "@usels/web";
    import { useRef$ } from "@usels/core";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      const { x$, y$, arrivedState$ } = useScroll(el$);

      return (
        <div ref={el$} style={{ overflow: "auto", height: 300 }}>
          <p>
            scrollX: {x$.get()}, scrollY: {y$.get()}
            {arrivedState$.bottom.get() && " — reached bottom"}
          </p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createScroll } from "@usels/web";
    import { createRef$ } from "@usels/core";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const { x$, y$, arrivedState$ } = createScroll(el$);

      return (
        <div ref={el$} style={{ overflow: "auto", height: 300 }}>
          <p>
            scrollX: {x$.get()}, scrollY: {y$.get()}
            {arrivedState$.bottom.get() && " — reached bottom"}
          </p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Window scroll

Use `useWindowScroll` for the common case, or pass `window` directly.

```tsx
import { useScroll } from "@usels/web";

function Component() {
  const { y$, arrivedState$, isScrolling$ } = useScroll(window);
}
```

### Arrived state with offset

Use `offset` to declare a threshold (in px) before the edge is considered "arrived".

```typescript
const { arrivedState$ } = useScroll(el$, {
  offset: { bottom: 100 }, // bottom=true when within 100px of the end
});
```

### isScrolling + onStop

```typescript
const { isScrolling$ } = useScroll(el$, {
  idle: 300, // ms to wait before isScrolling becomes false (default: 200)
  onStop: () => {
    // called when scrolling stops
  },
});
```

### Throttle

```typescript
const { x$, y$ } = useScroll(el$, { throttle: 50 }); // handler fires at most once per 50ms
```

### Manual re-measure

```typescript
const { y$, measure } = useScroll(el$);

// Call measure() to force-sync scroll state without a scroll event
measure();
```

### Reactive options

Options can be passed as plain values, per-field `Observable`s, or a single `Observable<UseScrollOptions>`. Changes are picked up reactively.

```typescript
import { observable } from "@usels/core";

const idle$ = observable(200);
const { isScrolling$ } = useScroll(el$, { idle: idle$ });

// Later: update idle time reactively
idle$.set(500);
```

## Type Declarations

```typescript
export { createScroll } from "./core";
export type { UseScrollOptions, UseScrollReturn, ArrivedState, ScrollDirections } from "./core";
export type UseScroll = typeof createScroll;
export declare const useScroll: UseScroll;
```

## Source

- Implementation: `packages/web/src/sensors/useScroll/index.ts`
- Documentation: `packages/web/src/sensors/useScroll/index.mdx`