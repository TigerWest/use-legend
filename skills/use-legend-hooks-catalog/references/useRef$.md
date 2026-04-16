# useRef$

> Part of `@usels/core` | Category: Reactivity

## Overview

An observable element ref hook that serves as a drop-in replacement for `useRef`. Works with callback ref composition and `forwardRef` patterns. The element is wrapped with `opaqueObject` to prevent legendapp/state from deeply observing DOM properties.

## Usage

### Standalone (useRef replacement)

<CodeTabs>
  <Fragment slot="hook">
    ```tsx 
        import { useRef$ } from "@usels/core";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive access with observe

Calling `el$.get()` inside `observe` automatically re-runs the observer when the element is mounted or unmounted.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObserve, useRef$ } from "@usels/core";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();

      useObserve(() => {
        const el = el$.get();
        if (el) el.focus();
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      observe(() => {
        const el = el$.get();
        if (el) el.focus();
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

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
export { REF$_SYMBOL, isRef$, createRef$ };
export type { Ref$ };
export type UseRef$ = typeof createRef$;
export declare const useRef$: UseRef$;
```

## Source

- Implementation: `packages/core/src/primitives/useRef$/index.ts`
- Documentation: `packages/core/src/primitives/useRef$/index.mdx`