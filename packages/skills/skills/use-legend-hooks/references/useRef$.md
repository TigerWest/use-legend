# useRef$

> Part of `@usels/core` | Category: Reactivity

## Overview

An observable element ref hook that serves as a drop-in replacement for `useRef`. Works with callback ref composition and `forwardRef` patterns. The element is wrapped with `opaqueObject` to prevent legendapp/state from deeply observing DOM properties.

## Usage

### Standalone (useRef replacement)

```tsx
import { useRef$ } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  return <div ref={el$} />;
}
```

### Reactive access with useObserve

Calling `el$.get()` inside `useObserve` automatically re-runs the observer when the element is mounted or unmounted.

```tsx
import { useObserve, useRef$ } from "@usels/core";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  useObserve(() => {
    const el = el$.get();
    if (el) {
      el.focus();
    }
  });

  return <div ref={el$} />;
}
```

### forwardRef pattern

```tsx
import { forwardRef } from "react";
import { useRef$ } from "@usels/core";

const Component = forwardRef<HTMLDivElement>((props, ref) => {
  const el$ = useRef$(ref);

  useObserve(() => {
    const el = el$.get();
    if (el) {
      console.log("element mounted:", el);
    }
  });

  return <div ref={el$} />;
});
```

## Type Declarations

```typescript
export declare const REF$_SYMBOL: unique symbol;
export type Ref$<T> = ((node: T | null) => void) & ReadonlyObservable<T> & {
    readonly [REF$_SYMBOL]: true;
    get(): T | null;
    peek(): T | null;
    set(value: T | null): void;
    current: T | null;
};
export declare function useRef$<T = any>(externalRef?: Ref<T> | null): Ref$<T>;
export declare function isRef$(v: unknown): v is Ref$<Element>;
```

## Source

- Implementation: `packages/core/src/reactivity/useRef$/index.ts`
- Documentation: `packages/core/src/reactivity/useRef$/index.md`