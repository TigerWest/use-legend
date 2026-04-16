# useMutationObserver

> Part of `@usels/web` | Category: Elements

## Overview

Reactive wrapper around the [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver). Observes one or more DOM nodes for mutations — attribute changes, child additions/removals, and text content changes. Targets can be `Ref$`, `MaybeElement`, or a plain `Element`.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useMutationObserver } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();

      useMutationObserver(
        el$,
        (records) => {
          records.forEach((r) => {
            /* handle r.type, r.target */
          });
        },
        { attributes: true, childList: true }
      );

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createMutationObserver } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      createMutationObserver(
        el$,
        (records) => {
          records.forEach((r) => {
            /* handle r.type, r.target */
          });
        },
        { attributes: true, childList: true }
      );

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Watching attributes only

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useMutationObserver(el$, callback, { attributes: true });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createMutationObserver(el$, callback, { attributes: true });
    ```
  </Fragment>
</CodeTabs>

### Filtering specific attributes

Only fire when `aria-expanded` or `data-active` change:

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useMutationObserver(el$, callback, {
      attributes: true,
      attributeFilter: ["aria-expanded", "data-active"],
    });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createMutationObserver(el$, callback, {
      attributes: true,
      attributeFilter: ["aria-expanded", "data-active"],
    });
    ```
  </Fragment>
</CodeTabs>

### Recording the previous attribute value

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useMutationObserver(
      el$,
      (records) => {
        records.forEach((r) => {
          const next = (r.target as Element).getAttribute(r.attributeName!);
          console.log("old:", r.oldValue, "→ new:", next);
        });
      },
      { attributes: true, attributeOldValue: true }
    );
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createMutationObserver(
      el$,
      (records) => {
        records.forEach((r) => {
          const next = (r.target as Element).getAttribute(r.attributeName!);
          console.log("old:", r.oldValue, "→ new:", next);
        });
      },
      { attributes: true, attributeOldValue: true }
    );
    ```
  </Fragment>
</CodeTabs>

### Watching descendant nodes with `subtree`

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useMutationObserver(el$, callback, { childList: true, subtree: true });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createMutationObserver(el$, callback, { childList: true, subtree: true });
    ```
  </Fragment>
</CodeTabs>

### Multiple targets

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    useMutationObserver([el$, anotherEl], callback, { attributes: true });
    ```
  </Fragment>
  <Fragment slot="scope">
    ```tsx
    createMutationObserver([el$, anotherEl], callback, { attributes: true });
    ```
  </Fragment>
</CodeTabs>

### Stop and resume

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const { stop, resume } = useMutationObserver(el$, callback, { childList: true });

    stop(); // disconnects the observer
    resume(); // reconnects with the same target and options
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    const { stop, resume } = createMutationObserver(el$, callback, { childList: true });

    stop(); // disconnects the observer
    resume(); // reconnects with the same target and options
    ```

  </Fragment>
</CodeTabs>

### Flushing pending records

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const { takeRecords } = useMutationObserver(el$, callback, { attributes: true });

    const pending = takeRecords();
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    const { takeRecords } = createMutationObserver(el$, callback, { attributes: true });

    const pending = takeRecords();
    ```

  </Fragment>
</CodeTabs>

### Checking browser support

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const { isSupported$ } = useMutationObserver(el$, callback, { attributes: true });

    console.log(isSupported$.get()); // Observable<boolean>
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    const { isSupported$ } = createMutationObserver(el$, callback, { attributes: true });

    console.log(isSupported$.get()); // Observable<boolean>
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createMutationObserver } from "./core";
export type { UseMutationObserverOptions, UseMutationObserverReturn } from "./core";
export type UseMutationObserver = typeof createMutationObserver;
export declare const useMutationObserver: UseMutationObserver;
```

## Source

- Implementation: `packages/web/src/elements/useMutationObserver/index.ts`
- Documentation: `packages/web/src/elements/useMutationObserver/index.mdx`