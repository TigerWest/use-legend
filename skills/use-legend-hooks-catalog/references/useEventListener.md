# useEventListener

> Part of `@usels/web` | Category: Browser

## Overview

Registers an event listener with `addEventListener` on mount and automatically removes it with `removeEventListener` on unmount. Targets can be `Ref`, `MaybeElement`, a plain `Element`, `Window`, or `Document`. The listener is always called with the latest closure value — state changes never cause stale callbacks.

## Usage

### Window (default target)

When no target is provided, the listener is attached to `window`.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useEventListener } from "@usels/web";

    function Component() {
      useEventListener("keydown", (ev) => {
        console.log(ev.key);
      });

      return null;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createEventListener } from "@usels/web";

    function Component() {
      "use scope"
      createEventListener("keydown", (ev) => {
        console.log(ev.key);
      });

      return null;
    }
    ```

  </Fragment>
</CodeTabs>

### Element target

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$, useEventListener } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();

      useEventListener(el$, "click", (ev) => {
        console.log("clicked", ev.target);
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createEventListener } from "@usels/web";
    import { createRef$ } from "@usels/core";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      createEventListener(el$, "click", (ev) => {
        console.log("clicked", ev.target);
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive Ref$ target

When an `Ref$` or `MaybeElement` is passed as the target, the listener is automatically re-registered whenever the element changes.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const el$ = useRef$<HTMLButtonElement>();

    useEventListener(el$, "pointerdown", (ev) => {
      ev.preventDefault();
    });

    return <button ref={el$} />;
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    const el$ = createRef$<HTMLButtonElement>();

    createEventListener(el$, "pointerdown", (ev) => {
      ev.preventDefault();
    });

    return <button ref={el$} />;
    ```

  </Fragment>
</CodeTabs>

### Multiple events

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useEventListener(el$, ["mouseenter", "mouseleave"], (ev) => {
      console.log(ev.type);
    });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createEventListener(el$, ["mouseenter", "mouseleave"], (ev) => {
      console.log(ev.type);
    });
    ```
  </Fragment>
</CodeTabs>

### Multiple listeners

<CodeTabs>
  <Fragment slot="hook">```tsx useEventListener(el$, "click", [onClickA, onClickB]); ```</Fragment>
  <Fragment slot="scope">
    ```tsx createEventListener(el$, "click", [onClickA, onClickB]); ```
  </Fragment>
</CodeTabs>

### Document / Window target

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useEventListener(document, "visibilitychange", () => {
      console.log(document.visibilityState);
    });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createEventListener(document, "visibilitychange", () => {
      console.log(document.visibilityState);
    });
    ```
  </Fragment>
</CodeTabs>

### AddEventListenerOptions

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useEventListener(el$, "scroll", onScroll, { passive: true });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createEventListener(el$, "scroll", onScroll, { passive: true });
    ```
  </Fragment>
</CodeTabs>

### Manual cleanup

The hook returns a cleanup function for imperative removal before unmount.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const stop = useEventListener("resize", onResize);

    // remove the listener early
    stop();
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    const stop = createEventListener("resize", onResize);

    // remove the listener early
    stop();
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createEventListener } from "./core";
export type { GeneralEventListener } from "./core";
export type UseEventListener = typeof createEventListener;
export declare const useEventListener: UseEventListener;
```

## Source

- Implementation: `packages/web/src/browser/useEventListener/index.ts`
- Documentation: `packages/web/src/browser/useEventListener/index.mdx`