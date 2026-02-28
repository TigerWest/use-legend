---
title: useSupported
description: SSR-safe browser feature detection as a reactive Observable
category: Browser Utilities
---

Check whether a browser API or feature is supported, returning a reactive `Observable<boolean>` that re-evaluates after the component mounts. Safe to use during SSR — the value is always `false` on the server and updates on the client after hydration.

## Usage

```typescript
import { useSupported } from '@usels/core'

const isMatchMediaSupported = useSupported(() => 'matchMedia' in window)

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