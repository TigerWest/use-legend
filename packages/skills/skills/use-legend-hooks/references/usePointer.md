# usePointer

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive pointer state tracking. Monitors `pointerdown`, `pointermove`, `pointerup`, and `pointerleave` events, exposing position, pressure, tilt, dimensions, twist, pointer type, and inside state as observables.

## Usage

```tsx
import { usePointer } from "@usels/web";

function PointerTracker() {
  const { x$, y$, pressure$, pointerType$, isInside$ } = usePointer();

  return (
    <div>
      <p>
        Position: ({x$.get()}, {y$.get()})
      </p>
      <p>Pressure: {pressure$.get()}</p>
      <p>Type: {pointerType$.get()}</p>
      <p>Inside: {isInside$.get() ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Filter by pointer type

```tsx
import { usePointer } from "@usels/web";

function PenOnly() {
  const { x$, y$, pressure$ } = usePointer({
    pointerTypes: ["pen"],
  });

  return (
    <p>
      Pen at ({x$.get()}, {y$.get()}) pressure: {pressure$.get()}
    </p>
  );
}
```

### Custom target

```tsx
import { usePointer } from "@usels/web";
import { useRef$ } from "@usels/core";

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

## Type Declarations

```typescript
export type UsePointerType = "mouse" | "touch" | "pen";
export interface UsePointerOptions extends ConfigurableWindow {
    target?: MaybeElement;
    pointerTypes?: UsePointerType[];
}
export interface UsePointerReturn {
    x$: ReadonlyObservable<number>;
    y$: ReadonlyObservable<number>;
    pressure$: ReadonlyObservable<number>;
    pointerId$: ReadonlyObservable<number>;
    tiltX$: ReadonlyObservable<number>;
    tiltY$: ReadonlyObservable<number>;
    width$: ReadonlyObservable<number>;
    height$: ReadonlyObservable<number>;
    twist$: ReadonlyObservable<number>;
    pointerType$: ReadonlyObservable<UsePointerType | null>;
    isInside$: ReadonlyObservable<boolean>;
}
export declare function usePointer(options?: DeepMaybeObservable<UsePointerOptions>): UsePointerReturn;
```

## Source

- Implementation: `packages/web/src/sensors/usePointer/index.ts`
- Documentation: `packages/web/src/sensors/usePointer/index.md`