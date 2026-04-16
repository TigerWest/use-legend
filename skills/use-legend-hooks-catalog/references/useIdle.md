# useIdle

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks whether the user is inactive (idle). Monitors user interaction events like mouse movement, keyboard input, touch, and window resize. After a configurable timeout with no activity, the idle state becomes true.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useIdle } from "@usels/web";

    function IdleTracker() {
      const { idle$, lastActive$, reset } = useIdle({ timeout: 5000 });

      return (
        <div>
          <p>Idle: {idle$.get() ? "Yes" : "No"}</p>
          <p>Last active: {new Date(lastActive$.get()).toLocaleTimeString()}</p>
          <button onClick={reset}>Reset</button>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createIdle } from "@usels/web";

    function IdleTracker() {
      "use scope"
      const { idle$, lastActive$, reset } = createIdle({ timeout: 5000 });

      return (
        <div>
          <p>Idle: {idle$.get() ? "Yes" : "No"}</p>
          <p>Last active: {new Date(lastActive$.get()).toLocaleTimeString()}</p>
          <button onClick={reset}>Reset</button>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Custom Events

```tsx
import { useIdle } from "@usels/web";

// Only track mouse and keyboard events
const { idle$ } = useIdle({
  timeout: 10000,
  events: ["mousemove", "keydown"],
});
```

## Type Declarations

```typescript
export { createIdle } from "./core";
export type { UseIdleOptions, UseIdleReturn } from "./core";
export type UseIdle = typeof createIdle;
export declare const useIdle: UseIdle;
```

## Source

- Implementation: `packages/web/src/sensors/useIdle/index.ts`
- Documentation: `packages/web/src/sensors/useIdle/index.mdx`