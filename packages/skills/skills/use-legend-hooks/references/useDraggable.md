# useDraggable

> Part of `@usels/web` | Category: Elements

## Overview

Makes any element draggable using Pointer Events. Returns Observable values for position (`x, `y), drag state (`isDragging), and a ready-to-use CSS style string (`style).

## Usage

### Basic drag

```tsx
import { useRef$, useDraggable } from "@usels/core";

function DraggableBox() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$ } = useDraggable(el$);

  return (
    <div ref={el$} style={{ position: "fixed", left: `${x$.get()}px`, top: `${y$.get()}px` }}>
      Drag me
    </div>
  );
}
```

### Axis restriction

Restrict movement to a single axis.

```typescript
const { x$ } = useDraggable(el$, { axis: "x" }); // horizontal only
const { y$ } = useDraggable(el$, { axis: "y" }); // vertical only
```

### With handle

Attach drag to a specific handle element instead of the whole target.

```tsx
import { useRef$, useDraggable } from "@usels/core";

function WithHandle() {
  const el$ = useRef$<HTMLDivElement>();
  const handle$ = useRef$<HTMLDivElement>();
  const { style$ } = useDraggable(el$, { handle: handle$ });
  // ...
}
```

### Container boundary

Clamp drag position inside a container element.

```typescript
const { style$ } = useDraggable(el$, {
  containerElement: container$,
});
```

### Restrict to viewport

```typescript
const { style$ } = useDraggable(el$, {
  restrictInView: true,
});
```

### Callbacks

```typescript
const { isDragging$ } = useDraggable(el$, {
  onStart: (pos, e) => {
    if (someCondition) return false; // cancel drag
  },
  onMove: (pos, e) => console.log(pos),
  onEnd: (pos, e) => savePosition(pos),
});
```

### Reactive position update

`x$` and `y$` are writable Observables — setting them directly updates `style$` and `position$`.

```typescript
const { x$, y$, style$, position$ } = useDraggable(el$);
x$.set(100);
y$.set(200);
// style$.get() === 'left: 100px; top: 200px;'
```

## Type Declarations

```typescript
export interface Position {
    x: number;
    y: number;
}
export interface UseDraggableOptions extends ConfigurableWindow {
    exact?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    capture?: boolean;
    handle?: MaybeElement;
    containerElement?: MaybeElement;
    initialValue?: Position;
    onStart?: (position: Position, event: PointerEvent) => void | false;
    onMove?: (position: Position, event: PointerEvent) => void;
    onEnd?: (position: Position, event: PointerEvent) => void;
    axis?: "x" | "y" | "both";
    disabled?: boolean;
    pointerTypes?: Array<"mouse" | "pen" | "touch">;
    restrictInView?: boolean;
}
export interface UseDraggableReturn {
    x$: Observable<number>;
    y$: Observable<number>;
    position$: Observable<Position>;
    isDragging$: Observable<boolean>;
    style$: Observable<string>;
}
export declare function useDraggable(target: MaybeElement, options?: DeepMaybeObservable<UseDraggableOptions>): UseDraggableReturn;
```

## Source

- Implementation: `packages/web/src/elements/useDraggable/index.ts`
- Documentation: `packages/web/src/elements/useDraggable/index.md`