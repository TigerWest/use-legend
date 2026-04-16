# useNavigatorLanguage

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the browser's preferred language via `navigator.language`. Automatically updates when the user changes their language preference.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useNavigatorLanguage } from "@usels/web";

    function LanguageDisplay() {
      const { isSupported$, language$ } = useNavigatorLanguage();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Language: {language$.get()}</p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createNavigatorLanguage } from "@usels/web";

    function LanguageDisplay() {
      "use scope"
      const { isSupported$, language$ } = createNavigatorLanguage();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Language: {language$.get()}</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createNavigatorLanguage } from "./core";
export type { UseNavigatorLanguageOptions, UseNavigatorLanguageReturn } from "./core";
export type UseNavigatorLanguage = typeof createNavigatorLanguage;
export declare const useNavigatorLanguage: UseNavigatorLanguage;
```

## Source

- Implementation: `packages/web/src/sensors/useNavigatorLanguage/index.ts`
- Documentation: `packages/web/src/sensors/useNavigatorLanguage/index.mdx`