---
title: useMagicKeys
category: Sensors
---

Reactive key-press state — access any key as a `ReadonlyObservable<boolean>` that is `true` while the key is held down.

## Demo

## Usage

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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

## Options

| Option         | Type                                    | Default | Description                                                     |
| -------------- | --------------------------------------- | ------- | --------------------------------------------------------------- |
| `aliasMap`     | `Record<string, string>`                | `{}`    | Additional key name aliases (merged with built-in defaults)     |
| `onEventFired` | `(e: KeyboardEvent) => boolean \| void` | —       | Called on every keydown/keyup. Return `false` to skip tracking. |

## Built-in Aliases

| Alias     | Resolves to  |
| --------- | ------------ |
| `ctrl`    | `control`    |
| `cmd`     | `meta`       |
| `command` | `meta`       |
| `option`  | `alt`        |
| `esc`     | `escape`     |
| `del`     | `delete`     |
| `space`   | ` ` (space)  |
| `up`      | `arrowup`    |
| `down`    | `arrowdown`  |
| `left`    | `arrowleft`  |
| `right`   | `arrowright` |

## Return Value

Returns a proxy object where:

| Property        | Type                              | Description                                    |
| --------------- | --------------------------------- | ---------------------------------------------- |
| `current$`      | `ReadonlyObservable<Set<string>>` | Set of currently pressed key names (lowercase) |
| `[key: string]` | `ReadonlyObservable<boolean>`     | `true` while the key (or combo) is held down   |

Key names are lowercased and resolved through the alias map. Combo keys are specified with `+` separator (e.g., `"ctrl+a"`, `"shift+enter"`).

For destructuring, append `$` to any key name (e.g., `shift$`) and use `_` instead of `+` for combos (e.g., `Ctrl_A$`). The `$` suffix is stripped and `_` is converted to `+` internally.
