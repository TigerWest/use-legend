---
title: useDeviceMotion
description: "Reactive [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent). Provides reactive access to device acceleration and rotation rate data."
category: Sensors
sidebar:
  order: 7
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useDeviceMotion } from "@usels/web";

function MyComponent() {
  const { acceleration$, rotationRate$, interval$, isSupported$ } = useDeviceMotion();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Acceleration X: {acceleration$.get().x}</p>
      <p>Rotation Alpha: {rotationRate$.get().alpha}</p>
      <p>Interval: {interval$.get()}ms</p>
    </div>
  );
}
```
