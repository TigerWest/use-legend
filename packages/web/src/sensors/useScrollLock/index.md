---
title: useScrollLock
category: Sensors
---

Lock and unlock scrolling on a target element or `document.body`. Useful for modals, drawers, and overlays that need to prevent background scrolling.

## Demo

## Usage

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
import { useScrollLock } from "@usels/web";
// ---cut---
const { isLocked$, unlock } = useScrollLock(undefined, true);
// scrolling is locked immediately on mount
```

### Reactive control

Pass an Observable as `initialState` to seed the lock state reactively.

```tsx twoslash
// @noErrors
import { observable } from "@legendapp/state";
import { useScrollLock } from "@usels/web";
// ---cut---
const locked$ = observable(false);
const { isLocked$ } = useScrollLock(undefined, locked$);
```
