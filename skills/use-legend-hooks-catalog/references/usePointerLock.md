# usePointerLock

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive wrapper around the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API). Captures the pointer so that mouse movement events are delivered regardless of cursor position, useful for games and 3D interactions.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePointerLock } from "@usels/web";

    function PointerLockDemo() {
      const { isSupported$, element$, lock, unlock } = usePointerLock();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Locked: {element$.get() ? "Yes" : "No"}</p>
          <button onClick={(e) => lock(e)}>Lock</button>
          <button onClick={() => unlock()}>Unlock</button>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPointerLock } from "@usels/web";

    function PointerLockDemo() {
      "use scope"
      const { isSupported$, element$, lock, unlock } = createPointerLock();

      return (
        <div>
          <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
          <p>Locked: {element$.get() ? "Yes" : "No"}</p>
          <button onClick={(e) => lock(e)}>Lock</button>
          <button onClick={() => unlock()}>Unlock</button>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Lock with a specific element

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { usePointerLock } from "@usels/web";
    import { useRef$ } from "@usels/core";

    function GameCanvas() {
      const canvas$ = useRef$<HTMLCanvasElement>();
      const { element$, lock, unlock } = usePointerLock();

      const handleClick = () => {
        const el = canvas$.current;
        if (el) lock(el);
      };

      return <canvas ref={canvas$} onClick={handleClick} width={800} height={600} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPointerLock } from "@usels/web";
    import { createRef$ } from "@usels/core";

    function GameCanvas() {
      "use scope"
      const canvas$ = createRef$<HTMLCanvasElement>();
      const { lock } = createPointerLock();

      const handleClick = () => {
        const el = canvas$.current;
        if (el) lock(el);
      };

      return <canvas ref={canvas$} onClick={handleClick} width={800} height={600} />;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPointerLock } from "./core";
export type { UsePointerLockReturn } from "./core";
export type UsePointerLock = typeof createPointerLock;
export declare const usePointerLock: UsePointerLock;
```

## Source

- Implementation: `packages/web/src/sensors/usePointerLock/index.ts`
- Documentation: `packages/web/src/sensors/usePointerLock/index.mdx`