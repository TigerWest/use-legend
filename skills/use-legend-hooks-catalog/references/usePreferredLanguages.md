# usePreferredLanguages

> Part of `@usels/web` | Category: Browser

## Overview

Reactive browser languages. Returns a `ReadonlyObservable<readonly string[]>` tracking the user's preferred languages via `navigator.languages`, updating on the `languagechange` event.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePreferredLanguages } from "@usels/web";

    function Component() {
      const languages$ = usePreferredLanguages();

      return <p>Languages: {languages$.get().join(", ")}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPreferredLanguages } from "@usels/web";

    function Component() {
      "use scope";
      const languages$ = createPreferredLanguages();

      return <p>Languages: {languages$.get().join(", ")}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPreferredLanguages } from "./core";
export type { UsePreferredLanguagesOptions, UsePreferredLanguagesReturn } from "./core";
export type UsePreferredLanguages = typeof createPreferredLanguages;
export declare const usePreferredLanguages: UsePreferredLanguages;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredLanguages/index.ts`
- Documentation: `packages/web/src/browser/usePreferredLanguages/index.mdx`