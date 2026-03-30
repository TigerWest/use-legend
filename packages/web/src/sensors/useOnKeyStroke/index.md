---
title: useOnKeyStroke
category: Sensors
sidebar:
  order: 1
---

Listen for keyboard key strokes with key filtering support.

## Demo

## Usage

```tsx twoslash
// @noErrors
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
