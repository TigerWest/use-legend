# useOnLongPress

> Part of `@usels/web` | Category: Sensors

## Overview

Detect long press gestures on an element. Fires a handler after a configurable delay, with support for distance thresholds, event modifiers, and a release callback.

## Usage

```tsx
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";

function Component() {
  const el$ = useRef$<HTMLDivElement>();

  useOnLongPress(el$, (e) => {
    console.log("Long pressed!", e);
  });

  return <div ref={el$}>Press and hold me</div>;
}
```

### Custom delay

```tsx
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";
// ---cut---
const el$ = useRef$<HTMLDivElement>();

useOnLongPress(el$, () => {}, { delay: 1000 }); // 1 second
```

### Distance threshold

Cancel the long press when the pointer moves too far from the initial position. Default is `10px`. Set to `false` to disable.

```tsx
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";
// ---cut---
const el$ = useRef$<HTMLDivElement>();

// Custom threshold
useOnLongPress(el$, () => {}, { distanceThreshold: 20 });

// Disable distance checking
useOnLongPress(el$, () => {}, { distanceThreshold: false });
```

### Release callback (onMouseUp)

`onMouseUp` is called when the pointer is released, providing duration, distance, and whether a long press was detected.

```tsx
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";
// ---cut---
const el$ = useRef$<HTMLDivElement>();

useOnLongPress(el$, () => {}, {
  onMouseUp: (duration, distance, isLongPress, event) => {
    if (isLongPress) {
      console.log(`Long press released after ${duration}ms`);
    } else {
      console.log(`Short press: ${duration}ms`);
    }
  },
});
```

### Event modifiers

```tsx
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";
// ---cut---
const el$ = useRef$<HTMLDivElement>();

useOnLongPress(el$, () => {}, {
  modifiers: {
    prevent: true, // preventDefault on pointer events
    stop: true, // stopPropagation
    self: true, // only trigger on the element itself (not children)
    capture: true, // use capturing phase
    once: true, // fire only once
  },
});
```

### Stop function

`useOnLongPress` returns a stop function to manually remove all listeners and clear timers.

```tsx
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";
// ---cut---
const el$ = useRef$<HTMLDivElement>();

const stop = useOnLongPress(el$, () => {});

// Later: remove all listeners
stop();
```

## Type Declarations

```typescript
export interface UseOnLongPressModifiers {
    stop?: boolean;
    once?: boolean;
    prevent?: boolean;
    capture?: boolean;
    self?: boolean;
}
export interface UseOnLongPressOptions {
    delay?: number;
    distanceThreshold?: number | false;
    modifiers?: UseOnLongPressModifiers;
    onMouseUp?: (duration: number, distance: number, isLongPress: boolean, event: PointerEvent) => void;
}
export declare function useOnLongPress(target: MaybeEventTarget, handler: (evt: PointerEvent) => void, options?: UseOnLongPressOptions): Fn;
```

## Source

- Implementation: `packages/web/src/sensors/useOnLongPress/index.ts`
- Documentation: `packages/web/src/sensors/useOnLongPress/index.md`