# usePreferredContrast

> Part of `@usels/web` | Category: Browser

## Overview

Reactive contrast preference. Returns a `ReadonlyObservable` tracking the user's preferred contrast level (`'more'`, `'less'`, `'custom'`, or `'no-preference'`) via `prefers-contrast` media queries.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePreferredContrast } from "@usels/web";

    function Component() {
      const contrast$ = usePreferredContrast();

      return <p>Contrast: {contrast$.get()}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredContrast } from "@usels/web";

    function Component() {
      "use scope";
      const contrast$ = createPreferredContrast();

      return <p>Contrast: {contrast$.get()}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPreferredContrast } from "./core";
export type { ContrastPreference, UsePreferredContrastReturn } from "./core";
export type UsePreferredContrast = typeof createPreferredContrast;
export declare const usePreferredContrast: UsePreferredContrast;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredContrast/index.ts`
- Documentation: `packages/web/src/browser/usePreferredContrast/index.mdx`