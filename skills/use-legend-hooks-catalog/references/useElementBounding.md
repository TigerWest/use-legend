# useElementBounding

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the bounding rect of a DOM element — `x`, `y`, `top`, `right`, `bottom`, `left`, `width`, `height` — as reactive `Observable<number>` values. Uses [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) for size changes, [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) for `style`/`class` attribute changes, and `scroll`/`resize` window events for position changes. `requestAnimationFrame` is used by default so CSS transform animations are captured accurately.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useElementBounding } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      const { top$, left$, width$, height$ } = useElementBounding(el$);

      return (
        <div ref={el$}>
          {width$.get()} × {height$.get()} at ({left$.get()}, {top$.get()})
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createElementBounding } from "@usels/web";

    function Component() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const { top$, left$, width$, height$ } = createElementBounding(el$);

      return (
        <div ref={el$}>
          {width$.get()} × {height$.get()} at ({left$.get()}, {top$.get()})
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Manual update

```tsx
import { useRef$, Ref$ } from "@usels/core";
import { useElementBounding } from "@usels/web";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { top$, left$, update } = useElementBounding(el$);

// Force-recalculate bounding rect imperatively
update();
```

### Disable window scroll tracking

```typescript
const { top$, left$ } = useElementBounding(el$, { windowScroll: false });
```

### Skip requestAnimationFrame (synchronous reads)

```typescript
const { width$, height$ } = useElementBounding(el$, { useCssTransforms: false });
```

### Keep values on unmount (no reset)

```typescript
const { top$ } = useElementBounding(el$, { reset: false });
```

## Type Declarations

```typescript
export { createElementBounding } from "./core";
export type { UseElementBoundingOptions, UseElementBoundingReturn } from "./core";
export type UseElementBounding = typeof createElementBounding;
export declare const useElementBounding: UseElementBounding;
```

## Source

- Implementation: `packages/web/src/elements/useElementBounding/index.ts`
- Documentation: `packages/web/src/elements/useElementBounding/index.mdx`