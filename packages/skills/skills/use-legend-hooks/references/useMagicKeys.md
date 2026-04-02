# useMagicKeys

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive key-press state — access any key as a `ReadonlyObservable<boolean>` that is `true` while the key is held down.

## Usage

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
export interface UseMagicKeysOptions extends ConfigurableWindow {
    aliasMap?: Record<string, string>;
    onEventFired?: (e: KeyboardEvent) => boolean | void;
    eventListenerOptions?: AddEventListenerOptions;
}
export type UseMagicKeysReturn = {
    current$: ReadonlyObservable<Set<string>>;
} & {
    [key: string]: ReadonlyObservable<boolean>;
};
export declare function useMagicKeys(options?: UseMagicKeysOptions): UseMagicKeysReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useMagicKeys/index.ts`
- Documentation: `packages/web/src/sensors/useMagicKeys/index.md`