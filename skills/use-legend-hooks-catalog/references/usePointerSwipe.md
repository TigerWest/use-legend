# usePointerSwipe

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive swipe detection based on PointerEvents. Detects swipe direction and distance.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePointerSwipe } from "@usels/web";
    import { useRef$ } from "@usels/core";

    function SwipeDemo() {
      const el$ = useRef$<HTMLDivElement>();
      const { isSwiping$, direction$, distanceX$, distanceY$ } = usePointerSwipe(el$, {
        threshold: 50,
        onSwipeEnd: (e, dir) => console.log(`Swiped ${dir}`),
      });

      return (
        <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
          <p>Direction: {direction$.get()}</p>
          <p>
            Distance: {distanceX$.get()}, {distanceY$.get()}
          </p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPointerSwipe } from "@usels/web";
    import { createRef$ } from "@usels/core";

    function SwipeDemo() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const { direction$, distanceX$, distanceY$ } = createPointerSwipe(el$, {
        threshold: 50,
        onSwipeEnd: (e, dir) => console.log(`Swiped ${dir}`),
      });

      return (
        <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
          <p>Direction: {direction$.get()}</p>
          <p>
            Distance: {distanceX$.get()}, {distanceY$.get()}
          </p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive options

```typescript
import { observable } from "@usels/core";

const threshold$ = observable(50);
const { direction$ } = usePointerSwipe(el$, { threshold: threshold$ });

// Later: adjust threshold reactively
threshold$.set(100);
```

## Type Declarations

```typescript
export { createPointerSwipe } from "./core";
export type { UsePointerSwipeOptions, UsePointerSwipeReturn, UseSwipeDirection, PointerType, } from "./core";
export type UsePointerSwipe = typeof createPointerSwipe;
export declare const usePointerSwipe: UsePointerSwipe;
```

## Source

- Implementation: `packages/web/src/sensors/usePointerSwipe/index.ts`
- Documentation: `packages/web/src/sensors/usePointerSwipe/index.mdx`