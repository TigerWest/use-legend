# usePreferredReducedMotion

> Part of `@usels/web` | Category: Browser

## Overview

Reactive reduced motion preference. Returns a `ReadonlyObservable` tracking the user's motion preference (`'reduce'` or `'no-preference'`) via the `prefers-reduced-motion` media query.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePreferredReducedMotion } from "@usels/web";

    function Component() {
      const motion$ = usePreferredReducedMotion();

      return <p>Motion: {motion$.get()}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredReducedMotion } from "@usels/web";

    function Component() {
      "use scope";
      const motion$ = createPreferredReducedMotion();

      return <p>Motion: {motion$.get()}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPreferredReducedMotion } from "./core";
export type { ReducedMotionPreference, UsePreferredReducedMotionReturn } from "./core";
export type UsePreferredReducedMotion = typeof createPreferredReducedMotion;
export declare const usePreferredReducedMotion: UsePreferredReducedMotion;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredReducedMotion/index.ts`
- Documentation: `packages/web/src/browser/usePreferredReducedMotion/index.mdx`