# useDraggable

> Part of `@usels/web` | Category: Elements

## Overview

Makes any element draggable using Pointer Events. Returns Observable values for position (`x$`, `y$`), drag state (`isDragging$`), and a ready-to-use CSS style string (`style$`).

## Usage

### Basic drag

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useDraggable } from "@usels/web";

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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createDraggable } from "@usels/web";

    function DraggableBox() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const { x$, y$ } = createDraggable(el$);

      return (
        <div ref={el$} style={{ position: "fixed", left: `${x$.get()}px`, top: `${y$.get()}px` }}>
          Drag me
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Axis restriction

Restrict movement to a single axis.

```typescript
const { x$ } = useDraggable(el$, { axis: "x" }); // horizontal only
const { y$ } = useDraggable(el$, { axis: "y" }); // vertical only
```

### With handle

Attach drag to a specific handle element instead of the whole target.

```tsx
import { useRef$ } from "@usels/core";
import { useDraggable } from "@usels/web";

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
export { createDraggable } from "./core";
export type { Position, UseDraggableOptions, UseDraggableReturn } from "./core";
export type UseDraggable = typeof createDraggable;
export declare const useDraggable: UseDraggable;
```

## Source

- Implementation: `packages/web/src/elements/useDraggable/index.ts`
- Documentation: `packages/web/src/elements/useDraggable/index.mdx`