# useParentElement

> Part of `@usels/web` | Category: Elements

## Overview

Returns the `parentElement` of a target DOM node as a reactive `Observable`. Re-evaluates whenever the target `Ref or `Observable` changes. Targets can be `Ref, `MaybeElement`, or a plain `Element`.

## Usage

```tsx
import { useRef$, useParentElement } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const parent$ = useParentElement(el$);

  return <div ref={el$} />;
}
```

### Reading the parent element

Use inside an `observer` component to reactively render based on the parent:

```tsx
import { useRef$, useParentElement } from "@usels/core";
import { observer } from "@legendapp/state/react";

const Component = observer(() => {
  const el$ = useRef$<HTMLDivElement>();
  const parent$ = useParentElement(el$);

  return <div ref={el$}>{parent$.get()?.tagName}</div>;
});
```

### With an Observable target

```tsx
import { observable } from "@legendapp/state";
import { useParentElement } from "@usels/core";

function Component() {
  const target$ = observable<HTMLElement | null>(null);
  const parent$ = useParentElement(target$);
  // ...
}
```

### With a plain element

```tsx
import { useParentElement } from "@usels/core";

function Component({ el }: { el: HTMLElement }) {
  const parent$ = useParentElement(el);
  // ...
}
```

## Type Declarations

```typescript
export declare function useParentElement(element?: MaybeEventTarget): Observable<OpaqueObject<HTMLElement | SVGElement> | null>;
```

## Source

- Implementation: `packages/web/src/elements/useParentElement/index.ts`
- Documentation: `packages/web/src/elements/useParentElement/index.md`