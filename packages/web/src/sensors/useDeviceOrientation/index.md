---
title: useDeviceOrientation
category: Sensors
---

Tracks the physical orientation of the device using the `deviceorientation` window event, exposing reactive observables for all orientation angles.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useDeviceOrientation } from "@usels/web";

const { isSupported$, isAbsolute$, alpha$, beta$, gamma$ } = useDeviceOrientation();

// alpha: rotation around z-axis (0–360)
// beta:  rotation around x-axis (-180–180)
// gamma: rotation around y-axis (-90–90)
console.log(alpha$.get(), beta$.get(), gamma$.get());
```
