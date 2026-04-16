# useSupported

> Part of `@usels/core` | Category: Utilities

## Overview

SSR-safe browser feature detection as a reactive Observable

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useSupported } from "@usels/core";

    function Component() {
      const isMatchMediaSupported$ = useSupported(() => "matchMedia" in window);
      // false on SSR, true after mount if supported
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createSupported } from "@usels/core";

    function Component() {
      "use scope"
      const isMatchMediaSupported$ = createSupported(() => "matchMedia" in window);
    }
    ```

  </Fragment>
</CodeTabs>

### Conditional rendering

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { Show, useSupported } from "@usels/core";

    function Component() {
      const isIntersectionObserverSupported$ = useSupported(
        () => "IntersectionObserver" in window
      );

      return (
        <Show
          if={isIntersectionObserverSupported$}
          else={<Fallback />}
        >
          <FeatureComponent />
        </Show>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createSupported, Show } from "@usels/core";

    function Component() {
      "use scope"
      const isIntersectionObserverSupported$ = createSupported(
        () => "IntersectionObserver" in window
      );

      return (
        <Show
          if={isIntersectionObserverSupported$}
          else={<Fallback />}
        >
          <FeatureComponent />
        </Show>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createSupported } from "./core";
export type { UseSupportedReturn } from "./core";
export type UseSupported = typeof createSupported;
export declare const useSupported: UseSupported;
```

## Source

- Implementation: `packages/core/src/utilities/useSupported/index.ts`
- Documentation: `packages/core/src/utilities/useSupported/index.mdx`