# useWhenMounted

> Part of `@usels/core` | Category: Utilities

## Overview

Execute a callback and expose its return value as a reactive Observable<T | undefined> — only after the component has mounted. Returns undefined during SSR and before hydration, then re-evaluates with the actual callback value once mounted.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useWhenMounted } from "@usels/core";

    function Component() {
      const windowWidth$ = useWhenMounted(() => window.innerWidth);
      // undefined on SSR, actual width after mount
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createWhenMounted } from "@usels/core";

    function Component() {
      "use scope"
      const windowWidth$ = createWhenMounted(() => window.innerWidth);
    }
    ```

  </Fragment>
</CodeTabs>

### Deferred browser API access

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useWhenMounted } from "@usels/core";

    function Component() {
      const scrollY$ = useWhenMounted(() => window.scrollY);
      const userAgent$ = useWhenMounted(() => navigator.userAgent);
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createWhenMounted } from "@usels/core";

    function Component() {
      "use scope"
      const scrollY$ = createWhenMounted(() => window.scrollY);
      const userAgent$ = createWhenMounted(() => navigator.userAgent);
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export type { UseWhenMountedReturn } from "./core";
export type UseWhenMounted = typeof createWhenMounted;
export declare const useWhenMounted: UseWhenMounted;
```

## Source

- Implementation: `packages/core/src/utilities/useWhenMounted/index.ts`
- Documentation: `packages/core/src/utilities/useWhenMounted/index.mdx`