# useThrottledHistory

> Part of `@usels/core` | Category: Reactivity

## Overview

A hook that tracks Observable change history with throttle. A thin wrapper around `useHistory` with `throttleFilter` applied — for rapidly changing values like sliders or drag interactions, it records snapshots at fixed intervals instead of on every change.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useObservable, useThrottledHistory } from "@usels/core";

    function Component() {
      const slider$ = useObservable(50);
      // Record at most once every 300ms
      const { undo, redo, canUndo$ } = useThrottledHistory(slider$, { throttle: 300 });

      return <input type="range" value={slider$.get()} onChange={(e) => slider$.set(+e.target.value)} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottledHistory, observable } from "@usels/core";

    function Component() {
      "use scope"
      const slider$ = observable(50);
      const { undo, redo, canUndo$ } = createThrottledHistory(slider$, { throttle: 300 });

      return <input type="range" value={slider$.get()} onChange={(e) => slider$.set(+e.target.value)} />;
    }
    ```

  </Fragment>
</CodeTabs>

### leading / trailing edges

By default both leading and trailing edges fire. Disable either to customize behavior.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useThrottledHistory } from "@usels/core";

    function Component() {
      const value$ = useObservable(0);
      // Only record on the trailing edge (end of throttle window)
      const { undo } = useThrottledHistory(value$, {
        throttle: 500,
        leading: false,
        trailing: true,
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottledHistory, observable } from "@usels/core";

    function Component() {
      "use scope"
      const value$ = observable(0);
      const { undo } = createThrottledHistory(value$, {
        throttle: 500,
        leading: false,
        trailing: true,
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Combined with capacity

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useThrottledHistory } from "@usels/core";

    function Component() {
      const position$ = useObservable({ x: 0, y: 0 });
      const { undo, redo } = useThrottledHistory(position$, {
        throttle: 200,
        capacity: 20, // keep at most 20 throttled snapshots
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottledHistory, observable } from "@usels/core";

    function Component() {
      "use scope"
      const position$ = observable({ x: 0, y: 0 });
      const { undo, redo } = createThrottledHistory(position$, {
        throttle: 200,
        capacity: 20,
      });
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createThrottledHistory, type ThrottledHistoryOptions } from "./core";
export type { DataHistoryReturn } from "../useDataHistory/core";
export type UseThrottledHistory = typeof createThrottledHistory;
export declare const useThrottledHistory: UseThrottledHistory;
```

## Source

- Implementation: `packages/core/src/state/useThrottledHistory/index.ts`
- Documentation: `packages/core/src/state/useThrottledHistory/index.mdx`