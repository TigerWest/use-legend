# useOnKeyStroke

> Part of `@usels/web` | Category: Sensors

## Overview

Listen for keyboard key strokes with key filtering support.

## Usage

```tsx
import { useOnKeyStroke, useOnKeyDown, useOnKeyUp } from "@usels/web";

function KeyStrokeDemo() {
  // Single key
  useOnKeyStroke("Enter", (e) => {
    console.log("Enter pressed!");
  });

  // Multiple keys
  useOnKeyStroke(["ArrowUp", "ArrowDown"], (e) => {
    console.log(`Arrow ${e.key} pressed!`);
  });

  // All keys
  useOnKeyStroke((e) => {
    console.log(`Key: ${e.key}`);
  });

  // Convenience functions
  useOnKeyDown("Escape", (e) => console.log("Escape down"));
  useOnKeyUp("Escape", (e) => console.log("Escape up"));

  return <div>Press any key</div>;
}
```

## Type Declarations

```typescript
export type KeyPredicate = (event: KeyboardEvent) => boolean;
export type KeyFilter = true | string | string[] | KeyPredicate;
export type KeyStrokeEventName = "keydown" | "keypress" | "keyup";
export interface UseOnKeyStrokeOptions extends ConfigurableWindow {
    eventName?: KeyStrokeEventName;
    target?: EventTarget | null;
    passive?: boolean;
    dedupe?: boolean;
}
export declare function useOnKeyStroke(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: UseOnKeyStrokeOptions): Fn;
export declare function useOnKeyStroke(handler: (event: KeyboardEvent) => void, options?: UseOnKeyStrokeOptions): Fn;
export declare function useOnKeyDown(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: Omit<UseOnKeyStrokeOptions, "eventName">): Fn;
export declare function useOnKeyPressed(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: Omit<UseOnKeyStrokeOptions, "eventName">): Fn;
export declare function useOnKeyUp(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: Omit<UseOnKeyStrokeOptions, "eventName">): Fn;
```

## Source

- Implementation: `packages/web/src/sensors/useOnKeyStroke/index.ts`
- Documentation: `packages/web/src/sensors/useOnKeyStroke/index.md`