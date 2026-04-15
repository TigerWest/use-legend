# useTextSelection

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the current text selection on the page. Listens to the `selectionchange` event and exposes the selected text, ranges, and bounding rectangles as observables.

## Usage

```tsx
import { useTextSelection } from "@usels/web";

function SelectionTracker() {
  const { text$, rects$, ranges$ } = useTextSelection();

  return (
    <div>
      <p>Select some text on the page</p>
      <p>Selected: {text$.get() || "Nothing selected"}</p>
      <p>Ranges: {ranges$.get().length}</p>
      <p>Rects: {rects$.get().length}</p>
    </div>
  );
}
```

### Highlight selected area

```tsx
import { useTextSelection } from "@usels/web";

function SelectionHighlight() {
  const { text$, rects$ } = useTextSelection();

  return (
    <>
      <p>Select any text to see highlight overlays</p>
      {rects$.get().map((rect, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            background: "rgba(59, 130, 246, 0.2)",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
```

### Throttle during drag-select

During drag-selection, `selectionchange` fires many times per frame. Use `throttle` to limit how often the handler runs while the user is actively selecting.

```typescript
const { text$ } = useTextSelection({ throttle: 100 }); // at most once per 100ms
```

### Debounce for final selection only

Use `debounce` when you only care about the selection after the user has finished selecting, not the intermediate states.

```typescript
const { text$ } = useTextSelection({ debounce: 200 }); // fires 200ms after selection stops
```

Both `throttle` and `debounce` accept a plain number or a reactive `Observable<number>` for dynamic control.

```typescript
import { observable } from "@usels/core";

const delay$ = observable(100);
const { text$ } = useTextSelection({ throttle: delay$ });

// change throttle interval at runtime
delay$.set(50);
```

## Type Declarations

```typescript
export interface UseTextSelectionOptions extends ConfigurableWindow {
    throttle?: MaybeObservable<number>;
    debounce?: MaybeObservable<number>;
}
export interface UseTextSelectionReturn {
    text$: ReadonlyObservable<string>;
    rects$: ReadonlyObservable<DOMRect[]>;
    ranges$: ReadonlyObservable<Range[]>;
    selection$: ReadonlyObservable<OpaqueObject<Selection> | null>;
}
export declare function useTextSelection(options?: UseTextSelectionOptions): UseTextSelectionReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useTextSelection/index.ts`
- Documentation: `packages/web/src/sensors/useTextSelection/index.md`