# useMediaQuery

> Part of `@usels/web` | Category: Browser

## Overview

Tracks a CSS media query string as a reactive `Observable<boolean>`. Subscribes to `MediaQueryList` change events and updates automatically. SSR-safe: accepts an optional `ssrWidth` to statically evaluate `min-width`/`max-width` queries on the server.

## Usage

```tsx
import { useMediaQuery } from "@usels/core";

function Component() {
  const isLarge$ = useMediaQuery("(min-width: 1024px)");

  return <p>{isLarge$.get() ? "Large screen" : "Small screen"}</p>;
}
```

### Multiple queries

```tsx
const isLarge$ = useMediaQuery("(min-width: 1024px)");
const prefersDark$ = useMediaQuery("(prefers-color-scheme: dark)");
```

### SSR with ssrWidth

```tsx
const isLarge$ = useMediaQuery("(min-width: 1024px)", { ssrWidth: 1280 });
```

`ssrWidth` is used to statically evaluate the query when `window` is unavailable,
preventing a layout shift between the server-rendered markup and the first client render.

## Type Declarations

```typescript
export declare function evaluateSSRQuery(query: string, ssrWidth: number): boolean;
export interface UseMediaQueryOptions extends ConfigurableWindow {
    ssrWidth?: number;
}
export type UseMediaQueryReturn = Observable<boolean>;
export declare function useMediaQuery(query: MaybeObservable<string>, options?: UseMediaQueryOptions): UseMediaQueryReturn;
```

## Source

- Implementation: `packages/web/src/browser/useMediaQuery/index.ts`
- Documentation: `packages/web/src/browser/useMediaQuery/index.md`