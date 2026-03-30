---
title: useTextSelection
category: Sensors
sidebar:
  order: 6
---

Reactively tracks the current text selection on the page. Listens to the `selectionchange` event and exposes the selected text, ranges, and bounding rectangles as observables.

`rects$` is computed lazily — `getBoundingClientRect()` is only called when `rects$` is actually accessed, avoiding unnecessary reflows when bounding rectangles are not needed.

## Demo

## Usage

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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
import { observable } from "@legendapp/state";

const delay$ = observable(100);
const { text$ } = useTextSelection({ throttle: delay$ });

// change throttle interval at runtime
delay$.set(50);
```
