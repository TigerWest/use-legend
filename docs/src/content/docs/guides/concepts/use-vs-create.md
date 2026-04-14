---
title: use* vs create*
description: Choose React hook wrappers for component bodies and create* primitives for scopes, stores, and reusable observable factories.
---

Most utilities come in two forms:

| Form | Where to use it |
| --- | --- |
| `use*` | React component or custom hook body |
| `create*` | `"use scope"`, `useScope` factory, store setup, or another lifecycle-owned factory |

## use* Hook Wrappers

Use `use*` when you are writing regular React hook code:

```tsx
import { useObservable } from "@usels/core";
import { useDebounced } from "@usels/core";

function Search() {
  const draft$ = useObservable("");
  const query$ = useDebounced(draft$, { ms: 150 });

  return <input value={draft$.get()} onChange={(event) => draft$.set(event.currentTarget.value)} />;
}
```

The hook wrapper follows React's hook rules and owns setup through React.

## create* Primitives

Use `create*` inside a scope or store setup:

```tsx
import { createDebounced, observable } from "@usels/core";

function Search() {
  "use scope";

  const draft$ = observable("");
  const query$ = createDebounced(draft$, { ms: 150 });

  return <input value={draft$.get()} onChange={(event) => draft$.set(event.currentTarget.value)} />;
}
```

The scope owns the lifecycle, so the primitive does not need to be a React hook.

## Web Example

The same rule applies to DOM APIs:

```tsx
import { createRef$ } from "@usels/core";
import { createElementSize } from "@usels/web";

function ResizablePanel() {
  "use scope";

  const el$ = createRef$<HTMLDivElement>();
  const { width$, height$ } = createElementSize(el$);

  return <div ref={el$}>{width$.get()} x {height$.get()}</div>;
}
```

In a regular hook body, use `useRef$` and `useElementSize` instead.

## Rule Of Thumb

If React is the lifecycle boundary, use `use*`.
If a use-legend scope or store is the lifecycle boundary, use `create*`.

`createStore()` is a store definition API, so it is the exception you define at
module scope.
