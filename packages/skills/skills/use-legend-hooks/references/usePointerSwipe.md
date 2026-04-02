# usePointerSwipe

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive swipe detection based on PointerEvents. Detects swipe direction and distance.

## Usage

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

### Reactive options

```typescript
import { observable } from "@legendapp/state";

const threshold$ = observable(50);
const { direction$ } = usePointerSwipe(el$, { threshold: threshold$ });

// Later: adjust threshold reactively
threshold$.set(100);
```

## Type Declarations

```typescript
export type UseSwipeDirection = "up" | "down" | "left" | "right" | "none";
export type PointerType = "mouse" | "touch" | "pen";
export interface UsePointerSwipeOptions {
    threshold?: number;
    onSwipeStart?: (e: PointerEvent) => void;
    onSwipe?: (e: PointerEvent) => void;
    onSwipeEnd?: (e: PointerEvent, direction: UseSwipeDirection) => void;
    pointerTypes?: PointerType[];
    disableTextSelect?: boolean;
}
export interface UsePointerSwipeReturn {
    isSwiping$: ReadonlyObservable<boolean>;
    direction$: ReadonlyObservable<UseSwipeDirection>;
    distanceX$: ReadonlyObservable<number>;
    distanceY$: ReadonlyObservable<number>;
    posStart$: ReadonlyObservable<{
        x: number;
        y: number;
    }>;
    posEnd$: ReadonlyObservable<{
        x: number;
        y: number;
    }>;
    stop: () => void;
}
export declare function usePointerSwipe(target: MaybeElement, options?: DeepMaybeObservable<UsePointerSwipeOptions>): UsePointerSwipeReturn;
```

## Source

- Implementation: `packages/web/src/sensors/usePointerSwipe/index.ts`
- Documentation: `packages/web/src/sensors/usePointerSwipe/index.md`