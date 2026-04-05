# useEventListener

> Part of `@usels/web` | Category: Browser

## Overview

Registers an event listener with `addEventListener` on mount and automatically removes it with `removeEventListener` on unmount. Targets can be `Ref, `MaybeElement`, a plain `Element`, `Window`, or `Document`. The listener is always called with the latest closure value — state changes never cause stale callbacks.

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

## Type Declarations

```typescript
export interface GeneralEventListener<E = Event> {
    (evt: E): void;
}
export declare function useEventListener<E extends keyof WindowEventMap>(event: Arrayable<E>, listener: Arrayable<(ev: WindowEventMap[E]) => void>, options?: MaybeObservable<boolean | AddEventListenerOptions>): () => void;
export declare function useEventListener<E extends keyof WindowEventMap>(target: Window | Observable<OpaqueObject<Window> | null>, event: Arrayable<E>, listener: Arrayable<(ev: WindowEventMap[E]) => void>, options?: MaybeObservable<boolean | undefined | AddEventListenerOptions>): () => void;
export declare function useEventListener<E extends keyof DocumentEventMap>(target: Document | Observable<OpaqueObject<Document> | null>, event: Arrayable<E>, listener: Arrayable<(ev: DocumentEventMap[E]) => void>, options?: MaybeObservable<boolean | AddEventListenerOptions>): () => void;
export declare function useEventListener<E extends keyof HTMLElementEventMap>(target: MaybeEventTarget | MaybeEventTarget[] | null | undefined, event: Arrayable<E>, listener: Arrayable<(ev: HTMLElementEventMap[E]) => void>, options?: MaybeObservable<boolean | AddEventListenerOptions>): () => void;
export declare function useEventListener<EventType = Event>(target: Observable<unknown> | ObservablePrimitive<unknown> | ReadonlyObservable<unknown> | null | undefined, event: Arrayable<string>, listener: Arrayable<GeneralEventListener<EventType>>, options?: MaybeObservable<boolean | AddEventListenerOptions>): () => void;
export declare function useEventListener<EventType = Event>(target: MaybeEventTarget | EventTarget | null | undefined, event: Arrayable<string>, listener: Arrayable<GeneralEventListener<EventType>>, options?: MaybeObservable<boolean | AddEventListenerOptions>): () => void;
export declare function useEventListener<EventType = Event>(target: EventTarget | null | undefined, event: Arrayable<string>, listener: Arrayable<GeneralEventListener<EventType>>, options?: MaybeObservable<boolean | AddEventListenerOptions>): () => void;
```

## Source

- Implementation: `packages/web/src/browser/useEventListener/index.ts`
- Documentation: `packages/web/src/browser/useEventListener/index.md`