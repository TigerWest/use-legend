# useElementHover

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks whether a DOM element is being hovered. Supports optional enter/leave delays for debounced hover behavior.

## Usage

```tsx
import { useElementHover } from "@usels/web";
import { useRef$ } from "@usels/core";

function HoverTracker() {
  const el$ = useRef$<HTMLDivElement>();
  const isHovered$ = useElementHover(el$);

  return <div ref={el$}>{isHovered$.get() ? "Hovered!" : "Hover me"}</div>;
}
```

### With Delay

```tsx
import { useElementHover } from "@usels/web";
import { useRef$ } from "@usels/core";

function DelayedHover() {
  const el$ = useRef$<HTMLDivElement>();
  const isHovered$ = useElementHover(el$, {
    delayEnter: 200,
    delayLeave: 300,
  });

  return <div ref={el$}>{isHovered$.get() ? "Hovered (with delay)" : "Hover me"}</div>;
}
```

### Reactive options

```typescript
import { observable } from "@usels/core";

const delayEnter$ = observable(200);
const isHovered$ = useElementHover(el$, { delayEnter: delayEnter$ });

// Later: update delay reactively
delayEnter$.set(500);
```

## Type Declarations

```typescript
export interface UseElementHoverOptions {
    delayEnter?: number;
    delayLeave?: number;
}
export declare function useElementHover(target: MaybeEventTarget, options?: DeepMaybeObservable<UseElementHoverOptions>): ReadonlyObservable<boolean>;
```

## Source

- Implementation: `packages/web/src/sensors/useElementHover/index.ts`
- Documentation: `packages/web/src/sensors/useElementHover/index.md`