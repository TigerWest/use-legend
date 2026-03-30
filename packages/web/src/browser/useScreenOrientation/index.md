---
title: useScreenOrientation
category: browser
---

Reactive wrapper for the [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation). Tracks the current screen orientation type and angle, and provides methods to lock and unlock orientation.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useScreenOrientation } from "@usels/web";

const { isSupported$, orientation$, angle$, lockOrientation, unlockOrientation } =
  useScreenOrientation();

// Read current orientation
console.log(orientation$.get()); // e.g. 'portrait-primary'
console.log(angle$.get()); // e.g. 0

// Lock to landscape (requires user gesture / fullscreen)
await lockOrientation("landscape");

// Unlock
unlockOrientation();
```
