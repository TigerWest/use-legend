# usePreferredDark

> Part of `@usels/web` | Category: Browser

## Overview

Reactive dark theme preference. Returns `Observable<boolean>` that tracks whether the user prefers a dark color scheme via the `(prefers-color-scheme: dark)` media query.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePreferredDark } from "@usels/web";

    function Component() {
      const isDark$ = usePreferredDark();

      return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredDark } from "@usels/web";

    function Component() {
      "use scope";
      const isDark$ = createPreferredDark();

      return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

### SSR with ssrWidth

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { usePreferredDark } from "@usels/web";

    function Component() {
      const isDark$ = usePreferredDark({ ssrWidth: 1280 });

      return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredDark } from "@usels/web";

    function Component() {
      "use scope";
      const isDark$ = createPreferredDark({ ssrWidth: 1280 });

      return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPreferredDark } from "./core";
export type { UsePreferredDarkReturn } from "./core";
export type { UseMediaQueryOptions } from "../useMediaQuery/core";
export type UsePreferredDark = typeof createPreferredDark;
export declare const usePreferredDark: UsePreferredDark;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredDark/index.ts`
- Documentation: `packages/web/src/browser/usePreferredDark/index.mdx`