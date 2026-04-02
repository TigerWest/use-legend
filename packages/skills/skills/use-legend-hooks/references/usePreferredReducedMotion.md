# usePreferredReducedMotion

> Part of `@usels/web` | Category: Browser

## Overview

Reactive reduced motion preference. Returns a `ReadonlyObservable` tracking the user's motion preference (`'reduce'` or `'no-preference'`) via the `prefers-reduced-motion` media query.

## Usage

```tsx
import { usePreferredReducedMotion } from "@usels/web";

function Component() {
  const motion$ = usePreferredReducedMotion();

  return <p>Motion: {motion$.get()}</p>;
}
```

## Type Declarations

```typescript
export type ReducedMotionPreference = "reduce" | "no-preference";
export type UsePreferredReducedMotionReturn = ReadonlyObservable<ReducedMotionPreference>;
export declare function usePreferredReducedMotion(): UsePreferredReducedMotionReturn;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredReducedMotion/index.ts`
- Documentation: `packages/web/src/browser/usePreferredReducedMotion/index.md`