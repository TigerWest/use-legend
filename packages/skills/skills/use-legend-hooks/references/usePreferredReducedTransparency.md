# usePreferredReducedTransparency

> Part of `@usels/web` | Category: Browser

## Overview

Reactive reduced transparency preference. Returns a `ReadonlyObservable` tracking the user's transparency preference (`'reduce'` or `'no-preference'`) via the `prefers-reduced-transparency` media query.

## Usage

```tsx
import { usePreferredReducedTransparency } from "@usels/web";

function Component() {
  const transparency$ = usePreferredReducedTransparency();

  return <p>Transparency: {transparency$.get()}</p>;
}
```

## Type Declarations

```typescript
export type ReducedTransparencyPreference = "reduce" | "no-preference";
export type UsePreferredReducedTransparencyReturn = ReadonlyObservable<ReducedTransparencyPreference>;
export declare function usePreferredReducedTransparency(): UsePreferredReducedTransparencyReturn;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredReducedTransparency/index.ts`
- Documentation: `packages/web/src/browser/usePreferredReducedTransparency/index.md`