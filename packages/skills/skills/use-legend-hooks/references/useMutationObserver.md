# useMutationObserver

> Part of `@usels/web` | Category: Elements

## Overview

Reactive wrapper around the [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver). Observes one or more DOM nodes for mutations — attribute changes, child additions/removals, and text content changes. Targets can be `Ref, `MaybeElement`, or a plain `Element`.

## Usage

```tsx
import { useRef$, useMutationObserver } from "@usels/core";
function Component() {
  const el$ = useRef$<HTMLDivElement>();

  useMutationObserver(
    el$,
    (records) => {
      records.forEach((r) => {
        /* handle r.type, r.target */
      });
    },
    { attributes: true, childList: true }
  );

  return <div ref={el$} />;
}
```

### Watching attributes only

```tsx
useMutationObserver(el$, callback, { attributes: true });
```

### Filtering specific attributes

Only fire when `aria-expanded` or `data-active` change:

```tsx
useMutationObserver(el$, callback, {
  attributes: true,
  attributeFilter: ["aria-expanded", "data-active"],
});
```

### Recording the previous attribute value

```tsx
useMutationObserver(
  el$,
  (records) => {
    records.forEach((r) => {
      const next = (r.target as Element).getAttribute(r.attributeName!);
      console.log("old:", r.oldValue, "→ new:", next);
    });
  },
  { attributes: true, attributeOldValue: true }
);
```

### Watching descendant nodes with `subtree`

```tsx
useMutationObserver(el$, callback, { childList: true, subtree: true });
```

### Multiple targets

```tsx
useMutationObserver([el$, anotherEl], callback, { attributes: true });
```

### Stop and resume

```tsx
const { stop, resume } = useMutationObserver(el$, callback, { childList: true });

stop(); // disconnects the observer
resume(); // reconnects with the same target and options
```

### Flushing pending records

```tsx
const { takeRecords } = useMutationObserver(el$, callback, { attributes: true });

const pending = takeRecords();
```

### Checking browser support

```tsx
const { isSupported$ } = useMutationObserver(el$, callback, { attributes: true });

console.log(isSupported$.get()); // Observable<boolean>
```

## Type Declarations

```typescript
export interface UseMutationObserverOptions extends MutationObserverInit {
}
export interface UseMutationObserverReturn extends Supportable {
    stop: () => void;
    resume: () => void;
    takeRecords: () => MutationRecord[];
}
export declare function useMutationObserver(target: MaybeEventTarget | MaybeEventTarget[], callback: MutationCallback, options?: UseMutationObserverOptions): UseMutationObserverReturn;
```

## Source

- Implementation: `packages/web/src/elements/useMutationObserver/index.ts`
- Documentation: `packages/web/src/elements/useMutationObserver/index.md`