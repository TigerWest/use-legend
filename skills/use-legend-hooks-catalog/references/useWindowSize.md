# useWindowSize

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the browser window dimensions as reactive `Observable<number>` values for width and height. Supports `inner`, `outer`, and `visual` viewport modes, and updates on resize and orientation change. SSR-safe: returns `initialWidth`/`initialHeight` (default `0`) when `window` is not available.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useWindowSize } from "@usels/web";

    function Component() {
      const size$ = useWindowSize();

      return (
        <p>
          {size$.width.get()} × {size$.height.get()}
        </p>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createWindowSize } from "@usels/web";

    function Component() {
      "use scope";
      const size$ = createWindowSize();

      return (
        <p>
          {size$.width.get()} × {size$.height.get()}
        </p>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Excluding scrollbar width

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const size$ = useWindowSize({ includeScrollbar: false });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function Component() {
      "use scope";
      const size$ = createWindowSize({ includeScrollbar: false });
    }
    ```
  </Fragment>
</CodeTabs>

### Outer window size

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const size$ = useWindowSize({ type: "outer" });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function Component() {
      "use scope";
      const size$ = createWindowSize({ type: "outer" });
    }
    ```
  </Fragment>
</CodeTabs>

### Visual viewport (pinch-zoom aware)

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const size$ = useWindowSize({ type: "visual" });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function Component() {
      "use scope";
      const size$ = createWindowSize({ type: "visual" });
    }
    ```
  </Fragment>
</CodeTabs>

### Custom initial size for SSR

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const size$ = useWindowSize({ initialWidth: 1280, initialHeight: 800 });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function Component() {
      "use scope";
      const size$ = createWindowSize({ initialWidth: 1280, initialHeight: 800 });
    }
    ```
  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createWindowSize } from "./core";
export type { UseWindowSizeOptions, UseWindowSizeReturn } from "./core";
export type UseWindowSize = typeof createWindowSize;
export declare const useWindowSize: UseWindowSize;
```

## Source

- Implementation: `packages/web/src/elements/useWindowSize/index.ts`
- Documentation: `packages/web/src/elements/useWindowSize/index.mdx`