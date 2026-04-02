# usePreferredContrast

> Part of `@usels/web` | Category: Browser

## Overview

Reactive contrast preference. Returns a `ReadonlyObservable` tracking the user's preferred contrast level (`'more'`, `'less'`, `'custom'`, or `'no-preference'`) via `prefers-contrast` media queries.

## Usage

```tsx
import { usePreferredContrast } from "@usels/web";

function Component() {
  const contrast$ = usePreferredContrast();

  return <p>Contrast: {contrast$.get()}</p>;
}
```

## Type Declarations

```typescript
export type ContrastPreference = "more" | "less" | "custom" | "no-preference";
export type UsePreferredContrastReturn = ReadonlyObservable<ContrastPreference>;
export declare function usePreferredContrast(): UsePreferredContrastReturn;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredContrast/index.ts`
- Documentation: `packages/web/src/browser/usePreferredContrast/index.md`