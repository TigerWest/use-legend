---
title: useEventListener
category: browser
---

Registers an event listener with `addEventListener` on mount and automatically removes it with `removeEventListener` on unmount.
Targets can be `Ref$`, `MaybeElement`, a plain `Element`, `Window`, or `Document`.
The listener is always called with the latest closure value — state changes never cause stale callbacks.

## Usage

### Window (default target)

When no target is provided, the listener is attached to `window`.

```tsx
import { useEventListener } from "@usels/core";

function Component() {
  useEventListener("keydown", (ev) => {
    console.log(ev.key);
  });

  return null;
}
```

### Element target

```tsx
import { useRef$, useEventListener } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  useEventListener(el$, "click", (ev) => {
    console.log("clicked", ev.target);
  });

  return <div ref={el$} />;
}
```

### Reactive Ref$ target

When an `Ref$` or `MaybeElement` is passed as the target, the listener is automatically re-registered whenever the element changes.

```tsx
const el$ = useRef$<HTMLButtonElement>();

useEventListener(el$, "pointerdown", (ev) => {
  ev.preventDefault();
});

return <button ref={el$} />;
```

### Multiple events

```tsx
useEventListener(el$, ["mouseenter", "mouseleave"], (ev) => {
  console.log(ev.type);
});
```

### Multiple listeners

```tsx
useEventListener(el$, "click", [onClickA, onClickB]);
```

### Document / Window target

```tsx
useEventListener(document, "visibilitychange", () => {
  console.log(document.visibilityState);
});
```

### AddEventListenerOptions

```tsx
useEventListener(el$, "scroll", onScroll, { passive: true });
```

### Manual cleanup

The hook returns a cleanup function for imperative removal before unmount.

```tsx
const stop = useEventListener("resize", onResize);

// remove the listener early
stop();
```

## Notes

**Plain element targets are not reactive.** If you pass a plain `HTMLElement` or `null` value and that reference changes after mount (e.g. via `useState`), the hook does not detect the change. Use `Ref$` or `MaybeElement` for targets that change over time.

```tsx
// ❌ listener stays on the original element if el changes via state
const [el, setEl] = useState<HTMLDivElement | null>(null);
useEventListener(el, "click", handler);

// ✅ listener is re-registered automatically when el$ changes
const el$ = useRef$<HTMLDivElement>();
useEventListener(el$, "click", handler);
```
