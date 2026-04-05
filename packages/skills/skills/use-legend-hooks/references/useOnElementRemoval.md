# useOnElementRemoval

> Part of `@usels/web` | Category: Sensors

## Overview

Fires a callback when the target element or any ancestor containing it is removed from the DOM. Uses [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) internally.

## Usage

```tsx
import { useOnElementRemoval } from "@usels/web";
import { useRef, useState } from "react";

function RemovalDetector() {
  const ref = useRef<HTMLDivElement>(null);
  const [removed, setRemoved] = useState(false);

  useOnElementRemoval(
    () => ref.current,
    () => setRemoved(true)
  );

  return (
    <div>
      {!removed && <div ref={ref}>Watch me!</div>}
      {removed && <p>Element was removed!</p>}
    </div>
  );
}
```

## Type Declarations

```typescript
export type UseOnElementRemovalOptions = ConfigurableDocumentOrShadowRoot;
export declare function useOnElementRemoval(target: MaybeEventTarget, callback: (mutations: MutationRecord[]) => void, options?: DeepMaybeObservable<UseOnElementRemovalOptions>): void;
```

## Source

- Implementation: `packages/web/src/sensors/useOnElementRemoval/index.ts`
- Documentation: `packages/web/src/sensors/useOnElementRemoval/index.md`