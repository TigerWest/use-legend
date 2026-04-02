# useNavigatorLanguage

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the browser's preferred language via `navigator.language`. Automatically updates when the user changes their language preference.

## Usage

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

## Type Declarations

```typescript
export interface UseNavigatorLanguageReturn extends Supportable {
    language$: ReadonlyObservable<string | undefined>;
}
export interface UseNavigatorLanguageOptions extends ConfigurableWindow {
}
export declare function useNavigatorLanguage(options?: UseNavigatorLanguageOptions): UseNavigatorLanguageReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useNavigatorLanguage/index.ts`
- Documentation: `packages/web/src/sensors/useNavigatorLanguage/index.md`