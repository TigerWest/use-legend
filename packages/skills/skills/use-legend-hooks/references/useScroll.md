# useScroll

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks the scroll position, scroll direction, arrived state (top/bottom/left/right), and scrolling status of any scrollable target — `HTMLElement`, `Document`, or `Window` — as reactive `Observable` values.

## Usage

### Basic — HTMLElement

```tsx
import { useScroll, useRef$ } from "@usels/core";

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

### Window scroll

Use `useWindowScroll` for the common case, or pass `window` directly.

```tsx
import { useScroll } from "@usels/core";

function Component() {
  const { y$, arrivedState$, isScrolling$ } = useScroll(window);
}
```

### Scroll direction

```tsx
import { useScroll, useRef$ } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { directions$ } = useScroll(el$);

  // directions$.bottom.get() → true while scrolling down
  // directions$.top.get()    → true while scrolling up
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

### Null / SSR-safe target

Passing `null` is safe — all observables stay at their initial values and no event listener is registered.

```tsx
import { useScroll } from "@usels/core";

const target = typeof window !== "undefined" ? document : null;
const { y$ } = useScroll(target);
```

### Reactive options

Options can be passed as plain values, per-field `Observable`s, or a single `Observable<UseScrollOptions>`. Changes are picked up reactively.

```typescript
import { observable } from "@legendapp/state";

const idle$ = observable(200);
const { isScrolling$ } = useScroll(el$, { idle: idle$ });

// Later: update idle time reactively
idle$.set(500);
```

## Type Declarations

```typescript
export interface UseScrollOptions extends ConfigurableWindow {
    throttle?: number;
    idle?: number;
    onScroll?: (e: Event) => void;
    onStop?: () => void;
    onError?: (error: unknown) => void;
    offset?: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
    behavior?: ScrollBehavior;
    eventListenerOptions?: AddEventListenerOptions;
}
export interface ArrivedState {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
}
export interface ScrollDirections {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
}
export interface UseScrollReturn {
    x$: Observable<number>;
    y$: Observable<number>;
    isScrolling$: Observable<boolean>;
    arrivedState$: Observable<ArrivedState>;
    directions$: Observable<ScrollDirections>;
    measure: () => void;
}
export declare function useScroll(element: MaybeElement, options?: DeepMaybeObservable<UseScrollOptions>): UseScrollReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useScroll/index.ts`
- Documentation: `packages/web/src/sensors/useScroll/index.md`