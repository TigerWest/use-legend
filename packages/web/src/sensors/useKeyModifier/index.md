---
title: useKeyModifier
category: Sensors
sidebar:
  order: 1
---

Reactively tracks the state of a keyboard modifier key (Shift, Control, Alt, CapsLock, etc.) using `event.getModifierState()`. Updates on keyboard and mouse events.

## Demo

## Usage

```tsx twoslash
// @noErrors
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
