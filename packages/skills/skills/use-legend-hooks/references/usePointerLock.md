# usePointerLock

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive wrapper around the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API). Captures the pointer so that mouse movement events are delivered regardless of cursor position, useful for games and 3D interactions.

## Usage

```tsx
import { usePointerLock } from "@usels/web";

function PointerLockDemo() {
  const { isSupported$, element$, lock, unlock } = usePointerLock();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Locked: {element$.get() ? "Yes" : "No"}</p>
      <button onClick={(e) => lock(e)}>Lock</button>
      <button onClick={() => unlock()}>Unlock</button>
    </div>
  );
}
```

### Lock with a specific element

```tsx
import { usePointerLock } from "@usels/web";
import { useRef$ } from "@usels/core";

function GameCanvas() {
  const canvas$ = useRef$<HTMLCanvasElement>();
  const { element$, lock, unlock } = usePointerLock();

  const handleClick = () => {
    const el = canvas$.current;
    if (el) lock(el);
  };

  return <canvas ref={canvas$} onClick={handleClick} width={800} height={600} />;
}
```

## Type Declarations

```typescript
export interface UsePointerLockReturn extends Supportable {
    element$: ReadonlyObservable<OpaqueObject<Element> | null>;
    lock: (target: Element | Event) => void;
    unlock: () => void;
}
export declare function usePointerLock(): UsePointerLockReturn;
```

## Source

- Implementation: `packages/web/src/sensors/usePointerLock/index.ts`
- Documentation: `packages/web/src/sensors/usePointerLock/index.md`