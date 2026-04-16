# useParallax

> Part of `@usels/web` | Category: Sensors

## Overview

Creates parallax effects easily. Uses `useDeviceOrientation` on mobile devices and falls back to mouse position on desktop. `roll$` and `tilt$` are reactive observables scaled to -0.5 ~ 0.5, and `source$` reports the active sensor source (`deviceOrientation` or `mouse`).

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useParallax } from "@usels/web";

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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createParallax } from "@usels/web";

    function ParallaxCard() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const { roll$, tilt$, source$ } = createParallax(el$);

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

  </Fragment>
</CodeTabs>

### Custom adjust functions

Scale or invert the raw sensor output via the four `*Adjust` callbacks.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    function ParallaxCard() {
      const el$ = useRef$<HTMLDivElement>();
      const { roll$, tilt$ } = useParallax(el$, {
        mouseTiltAdjust: (v) => v * 2,
        mouseRollAdjust: (v) => v * 0.5,
      });

      return <div ref={el$}>Tilt: {tilt$.get()}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function ParallaxCard() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const { roll$, tilt$ } = createParallax(el$, {
        mouseTiltAdjust: (v) => v * 2,
        mouseRollAdjust: (v) => v * 0.5,
      });

      return <div ref={el$}>Tilt: {tilt$.get()}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive options

Pass an `Observable` callback to change the adjustment function at runtime.

```typescript
import { observable } from "@usels/core";

const tiltAdjust$ = observable((v: number) => v * 2);
const { tilt$ } = useParallax(el$, { mouseTiltAdjust: tiltAdjust$ });

// Later — change the adjust function reactively
tiltAdjust$.set((v: number) => v * 3);
```

## Type Declarations

```typescript
export { createParallax } from "./core";
export type { UseParallaxOptions, UseParallaxReturn, UseParallaxSource } from "./core";
export type UseParallax = typeof createParallax;
export declare const useParallax: UseParallax;
```

## Source

- Implementation: `packages/web/src/sensors/useParallax/index.ts`
- Documentation: `packages/web/src/sensors/useParallax/index.mdx`