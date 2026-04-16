# useMagicKeys

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive key-press state — access any key as a `ReadonlyObservable<boolean>` that is `true` while the key is held down.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useMagicKeys } from "@usels/web";

    function KeyboardDemo() {
      const keys = useMagicKeys();

      return (
        <div>
          {/* Single key — true while held */}
          <p>A: {keys["a"].get() ? "pressed" : "released"}</p>
          {/* Modifier keys (aliases: ctrl, cmd, alt, esc, etc.) */}
          <p>Ctrl: {keys["ctrl"].get() ? "pressed" : "released"}</p>
          {/* Combo — true only when all parts are pressed simultaneously */}
          <p>Ctrl+S: {keys["ctrl+s"].get() ? "pressed" : "released"}</p>
          {/* Current pressed keys set */}
          <p>Pressed: {[...keys.current$.get()].join(", ")}</p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createMagicKeys } from "@usels/web";

    function KeyboardDemo() {
      "use scope"
      const keys = createMagicKeys();

      return (
        <div>
          <p>A: {keys["a"].get() ? "pressed" : "released"}</p>
          <p>Ctrl: {keys["ctrl"].get() ? "pressed" : "released"}</p>
          <p>Ctrl+S: {keys["ctrl+s"].get() ? "pressed" : "released"}</p>
          <p>Pressed: {[...keys.current$.get()].join(", ")}</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Destructuring with `$` suffix

Since JavaScript destructuring cannot use `+` or bracket notation, append `$` to key names and use `_` instead of `+` for combos:

```tsx
import { useMagicKeys } from "@usels/web";

function DestructuredDemo() {
  const { shift$, space$, Ctrl_S$ } = useMagicKeys();

  return (
    <div>
      <p>Shift: {shift$.get() ? "pressed" : "released"}</p>
      <p>Ctrl+S: {Ctrl_S$.get() ? "pressed" : "released"}</p>
    </div>
  );
}
```

## Type Declarations

```typescript
export { createMagicKeys } from "./core";
export type { UseMagicKeysOptions, UseMagicKeysReturn } from "./core";
export type UseMagicKeys = typeof createMagicKeys;
export declare const useMagicKeys: UseMagicKeys;
```

## Source

- Implementation: `packages/web/src/sensors/useMagicKeys/index.ts`
- Documentation: `packages/web/src/sensors/useMagicKeys/index.mdx`