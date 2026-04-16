# useKeyModifier

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively tracks the state of a keyboard modifier key (Shift, Control, Alt, CapsLock, etc.) using `event.getModifierState()`. Updates on keyboard and mouse events.

## Usage

<CodeTabs>
  <Fragment slot="hook">
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createKeyModifier } from "@usels/web";

    function ModifierTracker() {
      "use scope"
      const shift$ = createKeyModifier("Shift");
      const ctrl$ = createKeyModifier("Control");
      const alt$ = createKeyModifier("Alt");
      const capsLock$ = createKeyModifier("CapsLock");

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

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createKeyModifier } from "./core";
export type { KeyModifier, UseKeyModifierOptions, UseKeyModifierReturn } from "./core";
export type UseKeyModifier = typeof createKeyModifier;
export declare const useKeyModifier: UseKeyModifier;
```

## Source

- Implementation: `packages/web/src/sensors/useKeyModifier/index.ts`
- Documentation: `packages/web/src/sensors/useKeyModifier/index.mdx`