# useParallax

> Part of `@usels/web` | Category: Sensors

## Overview

Create parallax effects easily. Uses `useDeviceOrientation` on mobile devices and falls back to mouse position on desktop.

## Usage

```tsx
import { useParallax } from "@usels/web";
import { useRef$ } from "@usels/core";

function ParallaxCard() {
  const el$ = useRef$<HTMLDivElement>();
  const { roll$, tilt$, source$ } = useParallax(el$);

  return (
    <div
      ref={el$}
      style={{
        transform: `rotateX(${roll$.get() * 20}deg) rotateY(${tilt$.get() * 20}deg)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      <p>Source: {source$.get()}</p>
    </div>
  );
}
```

### With custom adjust functions

```tsx
import { useParallax } from "@usels/web";
import { useRef$ } from "@usels/core";

function ParallaxCard() {
  const el$ = useRef$<HTMLDivElement>();
  const { roll$, tilt$ } = useParallax(el$, {
    mouseTiltAdjust: (v) => v * 2,
    mouseRollAdjust: (v) => v * 0.5,
  });

  return <div ref={el$}>Tilt: {tilt$.get()}</div>;
}
```

### Reactive options

```typescript
import { observable } from "@legendapp/state";

const tiltAdjust$ = observable((v: number) => v * 2);
const { tilt$ } = useParallax(el$, { mouseTiltAdjust: tiltAdjust$ });

// Later: change the adjust function reactively
tiltAdjust$.set((v: number) => v * 3);
```

## Type Declarations

```typescript
export type UseParallaxSource = "deviceOrientation" | "mouse";
export interface UseParallaxOptions {
    deviceOrientationTiltAdjust?: (value: number) => number;
    deviceOrientationRollAdjust?: (value: number) => number;
    mouseTiltAdjust?: (value: number) => number;
    mouseRollAdjust?: (value: number) => number;
}
export interface UseParallaxReturn {
    roll$: ReadonlyObservable<number>;
    tilt$: ReadonlyObservable<number>;
    source$: ReadonlyObservable<UseParallaxSource>;
}
export declare function useParallax(target: MaybeEventTarget, options?: DeepMaybeObservable<UseParallaxOptions>): UseParallaxReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useParallax/index.ts`
- Documentation: `packages/web/src/sensors/useParallax/index.md`