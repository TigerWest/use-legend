# useElementByPoint

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the DOM element at specified x/y coordinates using `document.elementFromPoint()`. Uses `requestAnimationFrame` for continuous polling and supports both single and multiple element detection modes. Includes pausable controls.

## Usage

```tsx
import { useElementByPoint } from "@usels/web";

function ElementTracker() {
  const { element$, isActive$, pause, resume } = useElementByPoint({
    x: 100,
    y: 200,
  });

  return (
    <div>
      <p>Element: {element$.get()?.tagName ?? "none"}</p>
      <p>Active: {isActive$.get() ? "Yes" : "No"}</p>
      <button onClick={isActive$.get() ? pause : resume}>
        {isActive$.get() ? "Pause" : "Resume"}
      </button>
    </div>
  );
}
```

### Multiple Elements

```tsx
import { useElementByPoint } from "@usels/web";

// Returns all elements at the point (uses elementsFromPoint)
const { element$ } = useElementByPoint({
  x: () => mouseX,
  y: () => mouseY,
  multiple: true,
});
// element$.get() is Element[]
```

## Type Declarations

```typescript
export interface UseElementByPointOptions<M extends boolean = false> extends ConfigurableWindow {
    x: number;
    y: number;
    multiple?: M;
}
export type UseElementByPointReturn<M extends boolean = false> = Pausable & Supportable & {
    element$: ReadonlyObservable<M extends true ? Element[] : Element | null>;
};
export declare function useElementByPoint<M extends boolean = false>(options: DeepMaybeObservable<UseElementByPointOptions<M>>): UseElementByPointReturn<M>;
```

## Source

- Implementation: `packages/web/src/sensors/useElementByPoint/index.ts`
- Documentation: `packages/web/src/sensors/useElementByPoint/index.md`