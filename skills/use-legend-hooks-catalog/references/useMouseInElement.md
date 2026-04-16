# useMouseInElement

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the mouse cursor position relative to a DOM element and reports whether the cursor is inside or outside it. Observes `mousemove`, `document` `mouseleave`, [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver), [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) (`style`/`class` attribute changes), and `window` `scroll`/`resize` events to keep values accurate as the element moves or resizes. All return values are reactive `Observable<number | boolean>`.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useMouseInElement } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      const { elementX$, elementY$, isOutside$ } = useMouseInElement(el$);

      return (
        <div ref={el$}>
          {isOutside$.get() ? "outside" : `${elementX$.get()}, ${elementY$.get()}`}
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createMouseInElement } from "@usels/web";

    function Component() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const { elementX$, elementY$, isOutside$ } = createMouseInElement(el$);

      return (
        <div ref={el$}>
          {isOutside$.get() ? "outside" : `${elementX$.get()}, ${elementY$.get()}`}
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Disable outside tracking

By default `elementX$`/`elementY$` continue to update even when the cursor leaves the element.
Pass `handleOutside: false` to freeze the last in-element position once the cursor exits.

```typescript
const { elementX$, elementY$ } = useMouseInElement(el$, { handleOutside: false });
```

### Disable scroll / resize recalculation

```typescript
const { elementX$, elementY$ } = useMouseInElement(el$, {
  windowScroll: false,
  windowResize: false,
});
```

### Stop all observers manually

```tsx
import { useRef$, Ref$ } from "@usels/core";
import { useMouseInElement } from "@usels/web";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { elementX$, elementY$, stop } = useMouseInElement(el$);

// Tear down all event listeners and observers
stop();
```

### Global mouse coordinates

The raw `clientX` / `clientY` values are also exposed as `x$` and `y$`.

```tsx
import { useRef$, Ref$ } from "@usels/core";
import { useMouseInElement } from "@usels/web";
declare const el$: Ref$<HTMLDivElement>;
// ---cut---
const { x$, y$, elementX$, elementY$ } = useMouseInElement(el$);
```

## Type Declarations

```typescript
export { createMouseInElement } from "./core";
export type { UseMouseInElementOptions, UseMouseInElementReturn } from "./core";
export type UseMouseInElement = typeof createMouseInElement;
export declare const useMouseInElement: UseMouseInElement;
```

## Source

- Implementation: `packages/web/src/elements/useMouseInElement/index.ts`
- Documentation: `packages/web/src/elements/useMouseInElement/index.mdx`