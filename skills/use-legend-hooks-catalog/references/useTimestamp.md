# useTimestamp

> Part of `@usels/core` | Category: Timer

## Overview

Reactive Unix timestamp (ms) that auto-updates on every animation frame or interval

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useTimestamp } from "@usels/core";

    function Component() {
      const ts = useTimestamp();
      return <div>{ts.get()}</div>;
      // ts.get() → current Date.now(), updated every frame
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimestamp } from "@usels/core";

    function Component() {
      "use scope"
      const ts = createTimestamp();
      return <div>{ts.get()}</div>;
      // ts.get() → current Date.now(), updated every frame
    }
    ```

  </Fragment>
</CodeTabs>

### With offset

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { observable, useTimestamp } from "@usels/core";

    function Component() {
      const offset$ = observable(5000);
      const ts = useTimestamp({ offset: offset$ });
      // ts.get() → Date.now() + 5000 — offset is reactive, updates each tick
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimestamp, observable } from "@usels/core";

    function Component() {
      "use scope"
      const ts = createTimestamp({ offset: observable(5000) });
      // ts.get() → Date.now() + 5000 — offset is reactive, updates each tick
    }
    ```

  </Fragment>
</CodeTabs>

### With callback

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimestamp } from "@usels/core";

    function Component() {
      const ts = useTimestamp({
        callback: (timestamp) => {
          console.log("tick:", timestamp);
        },
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimestamp } from "@usels/core";

    function Component() {
      "use scope"
      const ts = createTimestamp({
        callback: (timestamp) => {
          console.log("tick:", timestamp);
        },
      });
    }
    ```

  </Fragment>
</CodeTabs>

### With pause/resume controls

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimestamp } from "@usels/core";

    function Component() {
      const { timestamp$, isActive$, pause, resume } = useTimestamp({ controls: true });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimestamp } from "@usels/core";

    function Component() {
      "use scope"
      const { timestamp$, isActive$, pause, resume } = createTimestamp({ controls: true });
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createTimestamp } from "./core";
export type { TimestampOptions } from "./core";
export type UseTimestamp = typeof createTimestamp;
export declare const useTimestamp: UseTimestamp;
```

## Source

- Implementation: `packages/core/src/timer/useTimestamp/index.ts`
- Documentation: `packages/core/src/timer/useTimestamp/index.mdx`