# useNow

> Part of `@usels/core` | Category: Timer

## Overview

Reactive current Date that auto-updates on every animation frame or interval

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useNow } from "@usels/core";

    function Component() {
      const now = useNow();
      return <div>{now.get().toLocaleTimeString()}</div>;
      // now.get() → current Date, updated every frame
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createNow } from "@usels/core";

    function Component() {
      "use scope"
      const { now$ } = createNow();
      return <div>{now$.get().toLocaleTimeString()}</div>;
      // now$.get() → current Date, updated every frame
    }
    ```

  </Fragment>
</CodeTabs>

### Interval-based (battery friendly)

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useNow } from "@usels/core";

    function Component() {
      const now = useNow({ interval: 1000 }); // updates every second
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createNow } from "@usels/core";

    function Component() {
      "use scope"
      const { now$ } = createNow({ interval: 1000 }); // updates every second
    }
    ```

  </Fragment>
</CodeTabs>

### With pause/resume controls

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useNow } from "@usels/core";

    function Component() {
      const { now$, isActive$, pause, resume } = useNow({ controls: true });

      // pause()  → stops auto-update
      // resume() → restarts
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createNow } from "@usels/core";

    function Component() {
      "use scope"
      const { now$, isActive$, pause, resume } = createNow();

      // pause()  → stops auto-update
      // resume() → restarts
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createNow } from "./core";
export type { NowOptions } from "./core";
export interface UseNowOptions<Controls extends boolean = false> {
    controls?: Controls;
    interval?: "requestAnimationFrame" | number;
}
export declare function useNow(options?: UseNowOptions<false>): ReadonlyObservable<Date>;
export declare function useNow(options: UseNowOptions<true>): {
    now$: ReadonlyObservable<Date>;
} & Pausable;
```

## Source

- Implementation: `packages/core/src/timer/useNow/index.ts`
- Documentation: `packages/core/src/timer/useNow/index.mdx`