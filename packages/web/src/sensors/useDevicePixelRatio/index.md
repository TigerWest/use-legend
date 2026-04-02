---
title: useDevicePixelRatio
description: "Reactively tracks `window.devicePixelRatio` using a `matchMedia` listener. Automatically updates when the display's pixel density changes (e.g., moving a window between monitors with different DPI, or browser zoom level changes)."
category: Sensors
sidebar:
  order: 7
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useDevicePixelRatio } from "@usels/web";

function PixelRatioDisplay() {
  const { isSupported$, pixelRatio$ } = useDevicePixelRatio();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Pixel Ratio: {pixelRatio$.get()}</p>
    </div>
  );
}
```
