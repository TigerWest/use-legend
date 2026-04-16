# useTimeout

> Part of `@usels/core` | Category: Timer

## Overview

Reactive boolean that becomes true after a given delay

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useTimeout } from "@usels/core";

    function Component() {
      const ready$ = useTimeout(1000);
      return <div>{ready$.get() ? "Ready!" : "Waiting..."}</div>;
      // ready$.get() === false while waiting
      // ready$.get() === true after 1000ms
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeout } from "@usels/core";

    function Component() {
      "use scope"
      const ready$ = createTimeout(1000);
      return <div>{ready$.get() ? "Ready!" : "Waiting..."}</div>;
      // ready$.get() === false while waiting
      // ready$.get() === true after 1000ms
    }
    ```

  </Fragment>
</CodeTabs>

### With callback

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeout } from "@usels/core";

    function Component() {
      useTimeout(500, {
        callback: () => console.log("done!"),
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeout } from "@usels/core";

    function Component() {
      "use scope"
      createTimeout(500, {
        callback: () => console.log("done!"),
      });
    }
    ```

  </Fragment>
</CodeTabs>

### With stop/start controls

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeout } from "@usels/core";

    function Component() {
      const { ready$, isPending$, stop, start } = useTimeout(1000, { controls: true });

      // stop()  → cancel the pending timeout
      // start() → restart the timer
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeout } from "@usels/core";

    function Component() {
      "use scope"
      const { ready$, isPending$, stop, start } = createTimeout(1000, { controls: true });

      // stop()  → cancel the pending timeout
      // start() → restart the timer
    }
    ```

  </Fragment>
</CodeTabs>

### Manual start (`immediate: false`)

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeout } from "@usels/core";

    function Component() {
      const { ready$, start } = useTimeout(1000, {
        controls: true,
        immediate: false,
      });

      // call start() when you're ready
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeout } from "@usels/core";

    function Component() {
      "use scope"
      const { ready$, start } = createTimeout(1000, {
        controls: true,
        immediate: false,
      });

      // call start() when you're ready
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createTimeout } from "./core";
export type { TimeoutOptions, TimeoutReturn } from "./core";
export type UseTimeout = typeof createTimeout;
export declare const useTimeout: UseTimeout;
```

## Source

- Implementation: `packages/core/src/timer/useTimeout/index.ts`
- Documentation: `packages/core/src/timer/useTimeout/index.mdx`