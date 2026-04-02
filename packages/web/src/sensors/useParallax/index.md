---
title: useParallax
description: "Create parallax effects easily. Uses `useDeviceOrientation` on mobile devices and falls back to mouse position on desktop."
category: Sensors
sidebar:
  order: 3
---

## Demo

## Usage

```tsx twoslash
// @noErrors
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
// @noErrors
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

## Notes

**`options` is `DeepMaybeObservable`.** Each option field can be a plain value or an `Observable`. Adjust callback options (`deviceOrientationTiltAdjust`, `deviceOrientationRollAdjust`, `mouseTiltAdjust`, `mouseRollAdjust`) are passed as plain functions or `Observable` functions.
