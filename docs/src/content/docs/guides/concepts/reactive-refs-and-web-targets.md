---
title: Reactive Refs & Web Targets
description: Use useRef$ and createRef$ when DOM targets can mount, unmount, or be replaced.
---

Web utilities often need a DOM target. A plain `useRef()` gives you a mutable
object, but other code cannot react when the element mounts, unmounts, or is
replaced.

`useRef$` returns an observable callback ref. Hooks and primitives can observe it
and re-register DOM work automatically.

## useRef$

```tsx
import { useRef$ } from "@usels/core";
import { useElementSize, useEventListener } from "@usels/web";

function Panel() {
  const el$ = useRef$<HTMLDivElement>();
  const { width$, height$ } = useElementSize(el$);

  useEventListener(el$, "click", () => {
    console.log("clicked");
  });

  return <div ref={el$}>{width$.get()} x {height$.get()}</div>;
}
```

If `el$` changes, `useElementSize` and `useEventListener` can react to the new
target.

## createRef$

Inside a scope, use `createRef$`:

```tsx
import { createRef$ } from "@usels/core";
import { createElementSize, createEventListener } from "@usels/web";

function Panel() {
  "use scope";

  const el$ = createRef$<HTMLDivElement>();
  const { width$, height$ } = createElementSize(el$);

  createEventListener(el$, "click", () => {
    console.log("clicked");
  });

  return <div ref={el$}>{width$.get()} x {height$.get()}</div>;
}
```

## When Plain Refs Are Not Enough

Avoid passing a plain element reference when the target can change:

```tsx
const ref = useRef<HTMLDivElement>(null);

useElementSize(ref.current);
```

The hook receives the current value once. It cannot subscribe to future element
changes. Use `Ref$` for element-based hooks and primitives.

## Next

Use the Web API reference when you know the target type:

- [useElementSize](/use-legend/web/useElementSize/)
- [useEventListener](/use-legend/web/useEventListener/)
- [useMouse](/use-legend/web/useMouse/)
