# useDocumentVisibility

> Part of `@usels/web` | Category: Elements

## Overview

Tracks the browser tab's visibility state (`'visible'` or `'hidden'`) as a reactive `Observable<DocumentVisibilityState>`. Updates automatically when the user switches tabs or minimizes the window. SSR-safe: returns `'visible'` when `document` is not available.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useDocumentVisibility } from "@usels/web";

    function Component() {
      const visibility$ = useDocumentVisibility();

      return <p>Tab is {visibility$.get()}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDocumentVisibility } from "@usels/web";

    function Component() {
      "use scope"
      const visibility$ = createDocumentVisibility();

      return <p>Tab is {visibility$.get()}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

### Pausing work when the tab is hidden

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useDocumentVisibility } from "@usels/web";
    import { useObserve } from "@usels/core";

    function Component() {
      const visibility$ = useDocumentVisibility();

      useObserve(() => {
        if (visibility$.get() === "hidden") pausePolling();
        else resumePolling();
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDocumentVisibility } from "@usels/web";
    import { createObserve } from "@usels/core";

    function Component() {
      "use scope"
      const visibility$ = createDocumentVisibility();

      createObserve(() => {
        if (visibility$.get() === "hidden") pausePolling();
        else resumePolling();
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Tracking page view time

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useDocumentVisibility } from "@usels/web";
    import { useObservable, useObserve } from "@usels/core";

    function Component() {
      const visibility$ = useDocumentVisibility();
      const visibleSince = useObservable(Date.now());

      useObserve(() => {
        if (visibility$.get() === "visible") {
          visibleSince.set(Date.now());
        } else {
          const elapsed = Date.now() - visibleSince.get();
          trackVisibleTime(elapsed);
        }
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDocumentVisibility } from "@usels/web";
    import { createObserve } from "@usels/core";
    import { observable } from "@usels/core";

    function Component() {
      "use scope"
      const visibility$ = createDocumentVisibility();
      const visibleSince = observable(Date.now());

      createObserve(() => {
        if (visibility$.get() === "visible") {
          visibleSince.set(Date.now());
        } else {
          const elapsed = Date.now() - visibleSince.get();
          trackVisibleTime(elapsed);
        }
      });
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createDocumentVisibility } from "./core";
export type UseDocumentVisibility = typeof createDocumentVisibility;
export declare const useDocumentVisibility: UseDocumentVisibility;
```

## Source

- Implementation: `packages/web/src/elements/useDocumentVisibility/index.ts`
- Documentation: `packages/web/src/elements/useDocumentVisibility/index.mdx`