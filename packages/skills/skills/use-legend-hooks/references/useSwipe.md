# useSwipe

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive swipe detection based on TouchEvents. Detects swipe direction and length.

## Usage

```tsx
import { useSwipe } from "@usels/web";
import { useRef$ } from "@usels/core";

function SwipeDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const { isSwiping$, direction$, lengthX$, lengthY$ } = useSwipe(el$, {
    threshold: 50,
    onSwipeEnd: (e, dir) => console.log(`Swiped ${dir}`),
  });

  return (
    <div ref={el$} style={{ width: 300, height: 300, background: "#eee" }}>
      <p>Swiping: {isSwiping$.get() ? "yes" : "no"}</p>
      <p>Direction: {direction$.get()}</p>
      <p>
        Length: {lengthX$.get()}, {lengthY$.get()}
      </p>
    </div>
  );
}
```

### Reactive options

```typescript
import { observable } from "@legendapp/state";

const threshold$ = observable(50);
const { direction$ } = useSwipe(el$, { threshold: threshold$ });

// Later: adjust threshold reactively
threshold$.set(100);
```

## Type Declarations

```typescript
export type { UseSwipeDirection };
export interface UseSwipeOptions {
    threshold?: number;
    onSwipeStart?: (e: TouchEvent) => void;
    onSwipe?: (e: TouchEvent) => void;
    onSwipeEnd?: (e: TouchEvent, direction: UseSwipeDirection) => void;
    passive?: boolean;
}
export interface UseSwipeReturn {
    isSwiping$: ReadonlyObservable<boolean>;
    direction$: ReadonlyObservable<UseSwipeDirection>;
    lengthX$: ReadonlyObservable<number>;
    lengthY$: ReadonlyObservable<number>;
    coordsStart$: ReadonlyObservable<{
        x: number;
        y: number;
    }>;
    coordsEnd$: ReadonlyObservable<{
        x: number;
        y: number;
    }>;
    stop: () => void;
}
export declare function useSwipe(target: MaybeElement, options?: DeepMaybeObservable<UseSwipeOptions>): UseSwipeReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useSwipe/index.ts`
- Documentation: `packages/web/src/sensors/useSwipe/index.md`