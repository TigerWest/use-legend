# usePreferredDark

> Part of `@usels/web` | Category: Browser

## Overview

Reactive dark theme preference. Returns `Observable<boolean>` that tracks whether the user prefers a dark color scheme via the `(prefers-color-scheme: dark)` media query.

## Usage

```tsx
import { usePreferredDark } from "@usels/web";

function Component() {
  const isDark$ = usePreferredDark();

  return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
}
```

### SSR with ssrWidth

```tsx
import { usePreferredDark } from "@usels/web";

function Component() {
  const isDark$ = usePreferredDark({ ssrWidth: 1280 });

  return <p>{isDark$.get() ? "Dark mode" : "Light mode"}</p>;
}
```

## Type Declarations

```typescript
export type UsePreferredDarkReturn = Observable<boolean>;
export declare function usePreferredDark(options?: UseMediaQueryOptions): UsePreferredDarkReturn;
```

## Source

- Implementation: `packages/web/src/browser/usePreferredDark/index.ts`
- Documentation: `packages/web/src/browser/usePreferredDark/index.md`