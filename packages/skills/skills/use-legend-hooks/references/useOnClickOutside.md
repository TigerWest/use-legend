# useOnClickOutside

> Part of `@usels/web` | Category: Sensors

## Overview

Listen for clicks outside of a target element. Useful for closing modals, dropdowns, and popovers when the user clicks elsewhere.

## Usage

```tsx
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

## Type Declarations

```typescript
export interface OnClickOutsideOptions<Controls extends boolean = false> extends ConfigurableWindow {
    ignore?: (string | MaybeElement)[];
    capture?: boolean;
    detectIframe?: boolean;
    controls?: Controls;
}
export type OnClickOutsideHandler<T extends {
    detectIframe?: boolean;
    controls?: boolean;
} = {
    detectIframe: false;
    controls: false;
}> = (event: (T["detectIframe"] extends true ? FocusEvent : never) | (T["controls"] extends true ? Event : never) | PointerEvent) => void;
export interface OnClickOutsideReturn {
    stop: Fn;
    cancel: Fn;
    trigger: (event: Event) => void;
}
export declare function useOnClickOutside<T extends OnClickOutsideOptions<false>>(target: MaybeElement, handler: OnClickOutsideHandler<T>, options?: T): Fn;
export declare function useOnClickOutside<T extends OnClickOutsideOptions<true>>(target: MaybeElement, handler: OnClickOutsideHandler<T>, options: T): OnClickOutsideReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useOnClickOutside/index.ts`
- Documentation: `packages/web/src/sensors/useOnClickOutside/index.md`