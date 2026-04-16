# useBattery

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive wrapper around the [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API). Provides real-time battery charging status and level information.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createBattery } from "@usels/web";

    function BatteryStatus() {
      "use scope"
      const { isSupported$, charging$, level$, chargingTime$, dischargingTime$ } = createBattery();

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

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createBattery } from "./core";
export type { UseBatteryReturn } from "./core";
export type UseBattery = typeof createBattery;
export declare const useBattery: UseBattery;
```

## Source

- Implementation: `packages/web/src/sensors/useBattery/index.ts`
- Documentation: `packages/web/src/sensors/useBattery/index.mdx`