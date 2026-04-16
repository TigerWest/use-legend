# useWindowFocus

> Part of `@usels/web` | Category: Elements

## Overview

Tracks whether the browser window currently has focus as a reactive `Observable<boolean>`. Updates automatically when the user switches tabs, clicks away, or returns to the window. SSR-safe: returns `false` when `document` is not available.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useWindowFocus } from "@usels/web";

    function Component() {
      const focused$ = useWindowFocus();

      return <p>Window is {focused$.get() ? "focused" : "blurred"}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createWindowFocus } from "@usels/web";

    function Component() {
      "use scope"
      const focused$ = createWindowFocus();

      return <p>Window is {focused$.get() ? "focused" : "blurred"}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

### Pausing work when the window loses focus

```tsx
const focused$ = useWindowFocus();

useObserve(() => {
  if (!focused$.get()) pausePolling();
  else resumePolling();
});
```

## Type Declarations

```typescript
export { createWindowFocus } from "./core";
export type { UseWindowFocusReturn } from "./core";
export type UseWindowFocus = typeof createWindowFocus;
export declare const useWindowFocus: UseWindowFocus;
```

## Source

- Implementation: `packages/web/src/elements/useWindowFocus/index.ts`
- Documentation: `packages/web/src/elements/useWindowFocus/index.mdx`