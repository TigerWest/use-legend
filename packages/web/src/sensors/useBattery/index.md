---
title: useBattery
category: Sensors
---

Reactive wrapper around the [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API). Provides real-time battery charging status and level information.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useBattery } from "@usels/web";

function BatteryStatus() {
  const { isSupported$, charging$, level$, chargingTime$, dischargingTime$ } = useBattery();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Charging: {charging$.get() ? "Yes" : "No"}</p>
      <p>Level: {Math.round(level$.get() * 100)}%</p>
      <p>Charging Time: {chargingTime$.get()}s</p>
      <p>Discharging Time: {dischargingTime$.get()}s</p>
    </div>
  );
}
```
