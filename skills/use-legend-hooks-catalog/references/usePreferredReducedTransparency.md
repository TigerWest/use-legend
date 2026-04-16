# usePreferredReducedTransparency

> Part of `@usels/web` | Category: Browser

## Overview

Reactive reduced transparency preference. Returns a `ReadonlyObservable` tracking the user's transparency preference (`'reduce'` or `'no-preference'`) via the `prefers-reduced-transparency` media query.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePreferredReducedTransparency } from "@usels/web";

    function Component() {
      const transparency$ = usePreferredReducedTransparency();

      return <p>Transparency: {transparency$.get()}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredReducedTransparency } from "@usels/web";

    function Component() {
      "use scope";
      const transparency$ = createPreferredReducedTransparency();

      return <p>Transparency: {transparency$.get()}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPreferredReducedTransparency } from "./core";
export type { ReducedTransparencyPreference, UsePreferredReducedTransparencyReturn } from "./core";
export type UsePreferredReducedTransparency = typeof createPreferredReducedTransparency;
export declare const usePreferredReducedTransparency: UsePreferredReducedTransparency;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredReducedTransparency/index.ts`
- Documentation: `packages/web/src/browser/usePreferredReducedTransparency/index.mdx`