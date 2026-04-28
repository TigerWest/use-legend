# useIsMounted

> Part of `@usels/core` | Category: Utilities

## Overview



## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useIsMounted } from "@usels/core";

    function Component() {
      const isMounted$ = useIsMounted();
      return <div>{isMounted$.get() ? "mounted" : "pending"}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createIsMounted } from "@usels/core";

    function Component() {
      "use scope"
      const isMounted$ = createIsMounted();
      return <div>{isMounted$.get() ? "mounted" : "pending"}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### Gating an effect until after mount

Use `.get()` inside `createObserve()` so the effect re-runs when the mounted flag flips — the initial pre-mount run short-circuits, then the post-mount re-run proceeds.

```tsx
import { createIsMounted, observable, createObserve } from "@usels/core";

function Component({ deps$ }: { deps$: Observable<unknown> }) {
  "use scope";
  const isMounted$ = createIsMounted();

  createObserve(() => {
    const deps = deps$.get();
    if (!isMounted$.get()) return; // skip pre-mount run
    applyOptions(deps);
  });

  return null;
}
```

## Type Declarations

```typescript
export { createIsMounted } from "./core";
export type UseIsMounted = typeof createIsMounted;
export declare const useIsMounted: UseIsMounted;
```

## Source

- Implementation: `packages/core/src/utilities/useIsMounted/index.ts`
- Documentation: `packages/core/src/utilities/useIsMounted/index.mdx`