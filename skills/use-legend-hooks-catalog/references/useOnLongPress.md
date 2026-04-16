# useOnLongPress

> Part of `@usels/web` | Category: Sensors

## Overview

Detect long press gestures on an element. Fires a handler after a configurable delay, with support for distance thresholds, event modifiers, and a release callback.

## Usage

<CodeTabs>
  <Fragment slot="hook">
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createOnLongPress } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      createOnLongPress(el$, (e) => {
        console.log("Long pressed!", e);
      });

      return <div ref={el$}>Press and hold me</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### Custom delay

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$ } from "@usels/core";
    import { useOnLongPress } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      useOnLongPress(el$, () => {}, { delay: 1000 }); // 1 second
      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createOnLongPress } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      createOnLongPress(el$, () => {}, { delay: 1000 }); // 1 second
      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Distance threshold

Cancel the long press when the pointer moves too far from the initial position. Default is `10px`. Set to `false` to disable.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$ } from "@usels/core";
    import { useOnLongPress } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();

      // Custom threshold
      useOnLongPress(el$, () => {}, { distanceThreshold: 20 });

      // Disable distance checking
      useOnLongPress(el$, () => {}, { distanceThreshold: false });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createOnLongPress } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      // Custom threshold
      createOnLongPress(el$, () => {}, { distanceThreshold: 20 });

      // Disable distance checking
      createOnLongPress(el$, () => {}, { distanceThreshold: false });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Release callback (onMouseUp)

`onMouseUp` is called when the pointer is released, providing duration, distance, and whether a long press was detected.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$ } from "@usels/core";
    import { useOnLongPress } from "@usels/web";

    function Component() {
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

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createOnLongPress } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      createOnLongPress(el$, () => {}, {
        onMouseUp: (duration, distance, isLongPress, event) => {
          if (isLongPress) {
            console.log(`Long press released after ${duration}ms`);
          } else {
            console.log(`Short press: ${duration}ms`);
          }
        },
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Event modifiers

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$ } from "@usels/core";
    import { useOnLongPress } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();

      useOnLongPress(el$, () => {}, {
        modifiers: {
          prevent: true,  // preventDefault on pointer events
          stop: true,     // stopPropagation
          self: true,     // only trigger on the element itself (not children)
          capture: true,  // use capturing phase
          once: true,     // fire only once
        },
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createOnLongPress } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();

      createOnLongPress(el$, () => {}, {
        modifiers: {
          prevent: true,  // preventDefault on pointer events
          stop: true,     // stopPropagation
          self: true,     // only trigger on the element itself (not children)
          capture: true,  // use capturing phase
          once: true,     // fire only once
        },
      });

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Stop function

`useOnLongPress` returns a stop function to manually remove all listeners and clear timers.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useRef$ } from "@usels/core";
    import { useOnLongPress } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      const stop = useOnLongPress(el$, () => {});

      // Later: remove all listeners
      stop();

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createOnLongPress } from "@usels/web";

    function Component() {
      "use scope"
      const el$ = createRef$<HTMLDivElement>();
      const stop = createOnLongPress(el$, () => {});

      // Later: remove all listeners
      stop();

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createOnLongPress } from "./core";
export type { UseOnLongPressModifiers, UseOnLongPressOptions } from "./core";
export type UseOnLongPress = typeof createOnLongPress;
export declare const useOnLongPress: UseOnLongPress;
```

## Source

- Implementation: `packages/web/src/sensors/useOnLongPress/index.ts`
- Documentation: `packages/web/src/sensors/useOnLongPress/index.mdx`