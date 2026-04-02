# usePreferredColorScheme

> Part of `@usels/web` | Category: Browser

## Overview

Reactive color scheme preference. Returns a `ReadonlyObservable` tracking the user's preferred color scheme (`'dark'`, `'light'`, or `'no-preference'`) via `prefers-color-scheme` media queries.

## Usage

```tsx
import { usePreferredColorScheme } from "@usels/web";

function Component() {
  const scheme$ = usePreferredColorScheme();

  return <p>Preferred: {scheme$.get()}</p>;
}
```

## Type Declarations

```typescript
export type ColorScheme = "dark" | "light" | "no-preference";
export type UsePreferredColorSchemeReturn = ReadonlyObservable<ColorScheme>;
export declare function usePreferredColorScheme(): UsePreferredColorSchemeReturn;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredColorScheme/index.ts`
- Documentation: `packages/web/src/browser/usePreferredColorScheme/index.md`