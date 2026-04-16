# usePreferredColorScheme

> Part of `@usels/web` | Category: Browser

## Overview

Reactive color scheme preference. Returns a `ReadonlyObservable` tracking the user's preferred color scheme (`'dark'`, `'light'`, or `'no-preference'`) via `prefers-color-scheme` media queries.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePreferredColorScheme } from "@usels/web";

    function Component() {
      const scheme$ = usePreferredColorScheme();

      return <p>Preferred: {scheme$.get()}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredColorScheme } from "@usels/web";

    function Component() {
      "use scope";
      const scheme$ = createPreferredColorScheme();

      return <p>Preferred: {scheme$.get()}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPreferredColorScheme } from "./core";
export type { ColorScheme, UsePreferredColorSchemeReturn } from "./core";
export type UsePreferredColorScheme = typeof createPreferredColorScheme;
export declare const usePreferredColorScheme: UsePreferredColorScheme;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredColorScheme/index.ts`
- Documentation: `packages/web/src/browser/usePreferredColorScheme/index.mdx`