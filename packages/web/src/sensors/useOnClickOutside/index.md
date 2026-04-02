---
title: useOnClickOutside
category: sensors
sidebar:
  order: 2
---

Listen for clicks outside of a target element.
Useful for closing modals, dropdowns, and popovers when the user clicks elsewhere.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useRef$ } from "@usels/core";
import { useOnClickOutside } from "@usels/web";
import { useObservable } from "@legendapp/state/react";

function Dropdown() {
  const el$ = useRef$<HTMLDivElement>();
  const isOpen$ = useObservable(false);

  useOnClickOutside(el$, () => {
    isOpen$.set(false);
  });

  return (
    <div>
      <button onClick={() => isOpen$.set(true)}>Open</button>
      {isOpen$.get() && <div ref={el$}>Dropdown content — click outside to close</div>}
    </div>
  );
}
```

### Ignore Elements

Pass CSS selectors or element refs to the `ignore` option to exclude certain elements from triggering the handler.

```tsx
// @noErrors
import { useRef$ } from "@usels/core";
import { useOnClickOutside } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();
  const trigger$ = useRef$<HTMLButtonElement>();

  useOnClickOutside(
    el$,
    () => {
      // won't fire when clicking the trigger button or any .ignore-me element
    },
    {
      ignore: [trigger$, ".ignore-me"],
    }
  );

  return (
    <div>
      <button ref={trigger$}>Toggle</button>
      <div ref={el$}>Panel</div>
    </div>
  );
}
```

### Iframe Detection

Set `detectIframe: true` to also trigger the handler when focus moves to an iframe element outside the target.

```typescript
useOnClickOutside(el$, handler, { detectIframe: true });
```

### Capture Phase

By default the event listener uses the capturing phase (`capture: true`).
Set `capture: false` to use the bubbling phase instead.

```typescript
useOnClickOutside(el$, handler, { capture: false });
```
