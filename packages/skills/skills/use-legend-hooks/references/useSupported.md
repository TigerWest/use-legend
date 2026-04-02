# useSupported

> Part of `@usels/core` | Category: Utilities

## Overview

SSR-safe browser feature detection as a reactive Observable

## Usage

```typescript
import { useSupported } from "@usels/core";

const isMatchMediaSupported = useSupported(() => "matchMedia" in window);

// Use the observable value
if (isMatchMediaSupported.get()) {
  // matchMedia is available
}
```

### With Legend-State reactive bindings

```typescript
import { useSupported } from '@usels/core'

const isIntersectionObserverSupported = useSupported(
  () => 'IntersectionObserver' in window
)

function MyComponent() {
  return (
    isIntersectionObserverSupported.get()
      ? <FeatureComponent />
      : <Fallback />
  )
}
```

## Type Declarations

```typescript
export type UseSupportedReturn = Observable<boolean>;
export declare function useSupported(callback: () => unknown): UseSupportedReturn;
```

## Source

- Implementation: `packages/core/src/utilities/useSupported/index.ts`
- Documentation: `packages/core/src/utilities/useSupported/index.md`