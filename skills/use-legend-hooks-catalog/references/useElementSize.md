# useElementSize

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the width and height of a DOM element using the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver). Returns reactive `Observable<number>` values that update whenever the element resizes. SVG elements use `getBoundingClientRect()` as a fallback. Supports all three box models.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useElementSize } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      const { width$, height$ } = useElementSize(el$);

      return (
        <div ref={el$}>
          {width$.get()} × {height$.get()}
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createElementSize } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const { width$, height$ } = createElementSize(el$);

      return (
        <div ref={el$}>
          {width$.get()} × {height$.get()}
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Custom initial size

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useElementSize(el$, { width: 320, height: 240 });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createElementSize(el$, { width: 320, height: 240 });
    ```
  </Fragment>
</CodeTabs>

### With `border-box`

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useElementSize(el$, undefined, { box: "border-box" });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createElementSize(el$, undefined, { box: "border-box" });
    ```
  </Fragment>
</CodeTabs>

### Stopping observation manually

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const { width$, height$, stop } = useElementSize(el$);

    stop();
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    const { width$, height$, stop } = createElementSize(el$);

    stop();
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createElementSize } from "./core";
export type { UseElementSizeOptions, UseElementSizeReturn } from "./core";
export type UseElementSize = typeof createElementSize;
export declare const useElementSize: UseElementSize;
```

## Source

- Implementation: `packages/web/src/elements/useElementSize/index.ts`
- Documentation: `packages/web/src/elements/useElementSize/index.mdx`