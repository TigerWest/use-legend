# useCountdown

> Part of `@usels/core` | Category: Timer

## Overview

Reactive countdown timer with pause/resume/reset controls

## Usage

### Basic

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useCountdown } from "@usels/core";

    function Component() {
      const { remaining$ } = useCountdown(60);
      return <div>{remaining$.get()}</div>;
      // remaining$.get() → 60, 59, 58, ... 0
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createCountdown } from "@usels/core";

    function Component() {
      "use scope"
      const { remaining$ } = createCountdown(60);
      return <div>{remaining$.get()}</div>;
      // remaining$.get() → 60, 59, 58, ... 0
    }
    ```

  </Fragment>
</CodeTabs>

### With callbacks

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useCountdown } from "@usels/core";

    function Component() {
      const { remaining$ } = useCountdown(10, {
        onTick: (remaining) => console.log(`${remaining}s left`),
        onComplete: () => console.log("Done!"),
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createCountdown } from "@usels/core";

    function Component() {
      "use scope"
      const { remaining$ } = createCountdown(10, {
        onTick: (remaining) => console.log(`${remaining}s left`),
        onComplete: () => console.log("Done!"),
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Custom interval

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useCountdown } from "@usels/core";

    function Component() {
      // Tick every 500ms instead of the default 1000ms
      const { remaining$ } = useCountdown(30, { interval: 500 });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createCountdown } from "@usels/core";

    function Component() {
      "use scope"
      // Tick every 500ms instead of the default 1000ms
      const { remaining$ } = createCountdown(30, { interval: 500 });
    }
    ```

  </Fragment>
</CodeTabs>

### Manual start

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useCountdown } from "@usels/core";

    function Component() {
      const { remaining$, start } = useCountdown(10, { immediate: false });
      // remaining$.get() === 10 (not started)
      // start() to begin countdown
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createCountdown } from "@usels/core";

    function Component() {
      "use scope"
      const { remaining$, start } = createCountdown(10, { immediate: false });
      // remaining$.get() === 10 (not started)
      // start() to begin countdown
    }
    ```

  </Fragment>
</CodeTabs>

### Reset / Stop / Start controls

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useCountdown } from "@usels/core";

    function Component() {
      const { remaining$, reset, stop, start, pause, resume } = useCountdown(60);

      // reset()       → remaining$ back to 60 (timer keeps running)
      // reset(30)     → remaining$ set to 30
      // stop()        → pause + reset (fully stop)
      // start()       → reset + resume (restart)
      // start(30)     → reset to 30 + resume
      // pause()       → freeze countdown
      // resume()      → continue from current remaining$
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createCountdown } from "@usels/core";

    function Component() {
      "use scope"
      const { remaining$, reset, stop, start, pause, resume } = createCountdown(60);

      // reset()       → remaining$ back to 60 (timer keeps running)
      // reset(30)     → remaining$ set to 30
      // stop()        → pause + reset (fully stop)
      // start()       → reset + resume (restart)
      // start(30)     → reset to 30 + resume
      // pause()       → freeze countdown
      // resume()      → continue from current remaining$
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createCountdown } from "./core";
export type { CountdownOptions, CountdownReturn } from "./core";
export type UseCountdown = typeof createCountdown;
export declare const useCountdown: UseCountdown;
```

## Source

- Implementation: `packages/core/src/timer/useCountdown/index.ts`
- Documentation: `packages/core/src/timer/useCountdown/index.mdx`