# useKeyModifier

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the state of a keyboard modifier key (Shift, Control, Alt, CapsLock, etc.) using `event.getModifierState()`. Updates on keyboard and mouse events.

## Usage

```tsx
import { useKeyModifier } from "@usels/web";

function ModifierTracker() {
  const shift$ = useKeyModifier("Shift");
  const ctrl$ = useKeyModifier("Control");
  const alt$ = useKeyModifier("Alt");
  const capsLock$ = useKeyModifier("CapsLock");

  return (
    <div>
      <p>Shift: {shift$.get() ? "Pressed" : "Released"}</p>
      <p>Ctrl: {ctrl$.get() ? "Pressed" : "Released"}</p>
      <p>Alt: {alt$.get() ? "Pressed" : "Released"}</p>
      <p>CapsLock: {capsLock$.get() ? "On" : "Off"}</p>
    </div>
  );
}
```

## Type Declarations

```typescript
export type KeyModifier = "Alt" | "AltGraph" | "CapsLock" | "Control" | "Fn" | "FnLock" | "Meta" | "NumLock" | "ScrollLock" | "Shift" | "Symbol" | "SymbolLock";
export interface UseKeyModifierOptions<Initial extends boolean | null = null> extends ConfigurableWindow {
    events?: string[];
    initial?: Initial;
}
export type UseKeyModifierReturn<Initial extends boolean | null = null> = ReadonlyObservable<Initial extends boolean ? boolean : boolean | null>;
export declare function useKeyModifier<Initial extends boolean | null = null>(modifier: KeyModifier, options?: UseKeyModifierOptions<Initial>): UseKeyModifierReturn<Initial>;
```

## Source

- Implementation: `packages/web/src/sensors/useKeyModifier/index.ts`
- Documentation: `packages/web/src/sensors/useKeyModifier/index.md`