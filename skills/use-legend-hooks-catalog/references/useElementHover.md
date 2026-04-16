# useElementHover

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks whether a DOM element is being hovered. Supports optional enter/leave delays for debounced hover behavior.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useElementHover } from "@usels/web";
    import { useRef$ } from "@usels/core";

    function HoverTracker() {
      const el$ = useRef$<HTMLDivElement>();
      const isHovered$ = useElementHover(el$);

      return <div ref={el$}>{isHovered$.get() ? "Hovered!" : "Hover me"}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createElementHover } from "@usels/web";
    import { createRef$ } from "@usels/core";

    function HoverTracker() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const isHovered$ = createElementHover(el$);

      return <div ref={el$}>{isHovered$.get() ? "Hovered!" : "Hover me"}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### With Delay

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useElementHover } from "@usels/web";
    import { useRef$ } from "@usels/core";

    function DelayedHover() {
      const el$ = useRef$<HTMLDivElement>();
      const isHovered$ = useElementHover(el$, {
        delayEnter: 200,
        delayLeave: 300,
      });

      return <div ref={el$}>{isHovered$.get() ? "Hovered (with delay)" : "Hover me"}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createElementHover } from "@usels/web";
    import { createRef$ } from "@usels/core";

    function DelayedHover() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const isHovered$ = createElementHover(el$, {
        delayEnter: 200,
        delayLeave: 300,
      });

      return <div ref={el$}>{isHovered$.get() ? "Hovered (with delay)" : "Hover me"}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive options

```typescript
import { observable } from "@usels/core";

const delayEnter$ = observable(200);
const isHovered$ = useElementHover(el$, { delayEnter: delayEnter$ });

// Later: update delay reactively
delayEnter$.set(500);
```

## Type Declarations

```typescript
export { createElementHover } from "./core";
export type { UseElementHoverOptions, UseElementHoverReturn } from "./core";
export type UseElementHover = typeof createElementHover;
export declare const useElementHover: UseElementHover;
```

## Source

- Implementation: `packages/web/src/sensors/useElementHover/index.ts`
- Documentation: `packages/web/src/sensors/useElementHover/index.mdx`