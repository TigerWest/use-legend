# useScrollLock

> Part of `@usels/web` | Category: Sensors

## Overview

Lock and unlock scrolling on a target element or `document.body`. Useful for modals, drawers, and overlays that need to prevent background scrolling.

## Usage

```tsx
import { useScrollLock } from "@usels/web";

function Component() {
  const { isLocked$, lock, unlock, toggle } = useScrollLock();

  return (
    <div>
      <p>Scroll is {isLocked$.get() ? "locked" : "unlocked"}</p>
      <button onClick={toggle}>Toggle scroll lock</button>
    </div>
  );
}
```

### With target element

By default, scroll lock is applied to `document.body`. Pass any element via the first argument to scope locking to that element.

```tsx
import { useRef$ } from "@usels/core";
import { useScrollLock } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const { isLocked$, toggle } = useScrollLock(el$);

  return (
    <div ref={el$} style={{ overflow: "auto", height: 300 }}>
      <button onClick={toggle}>{isLocked$.get() ? "Unlock" : "Lock"} scroll</button>
      {/* long content */}
    </div>
  );
}
```

### Initial locked state

Pass `true` as the second argument to start with scrolling locked on mount.

```tsx
import { useScrollLock } from "@usels/web";
// ---cut---
const { isLocked$, unlock } = useScrollLock(undefined, true);
// scrolling is locked immediately on mount
```

### Reactive control

Pass an Observable as `initialState` to seed the lock state reactively.

```tsx
import { observable } from "@usels/core";
import { useScrollLock } from "@usels/web";
// ---cut---
const locked$ = observable(false);
const { isLocked$ } = useScrollLock(undefined, locked$);
```

## Type Declarations

```typescript
export interface UseScrollLockReturn {
    isLocked$: Observable<boolean>;
    lock: () => void;
    unlock: () => void;
    toggle: () => void;
}
export declare function useScrollLock(element?: MaybeEventTarget<HTMLElement>, initialState?: MaybeObservable<boolean>, options?: ConfigurableWindow): UseScrollLockReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useScrollLock/index.ts`
- Documentation: `packages/web/src/sensors/useScrollLock/index.md`