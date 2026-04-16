# useNetwork

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive network status tracking. Provides online/offline state via `navigator.onLine` and detailed connection metadata via the Network Information API as Observables.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useNetwork } from "@usels/web";

    function Component() {
      const { isOnline$ } = useNetwork();

      return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createNetwork } from "@usels/web";

    function Component() {
      "use scope"
      const { isOnline$ } = createNetwork();

      return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### Basic usage

Check whether the browser is currently online or offline with `isOnline$`. The value updates automatically on `online` and `offline` window events.

```tsx
import { useNetwork } from "@usels/web";

function Component() {
  const { isOnline$, onlineAt$, offlineAt$ } = useNetwork();

  return (
    <div>
      <p>Status: {isOnline$.get() ? "Online" : "Offline"}</p>
      <p>Online since: {onlineAt$.get() ?? "—"}</p>
      <p>Offline since: {offlineAt$.get() ?? "—"}</p>
    </div>
  );
}
```

### Connection details (Chromium only)

The Network Information API (`navigator.connection`) exposes detailed bandwidth and connection metadata. Check `isSupported$` before relying on these values — they are `undefined` in unsupported browsers.

```tsx
import { useNetwork } from "@usels/web";

function Component() {
  const { isSupported$, downlink$, effectiveType$, rtt$, type$, saveData$ } = useNetwork();

  if (!isSupported$.get()) {
    return <p>Network Information API is not supported.</p>;
  }

  return (
    <div>
      <p>Type: {type$.get()}</p>
      <p>Effective type: {effectiveType$.get()}</p>
      <p>Downlink: {downlink$.get()} Mbps</p>
      <p>RTT: {rtt$.get()} ms</p>
      <p>Save data: {saveData$.get() ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Online/offline event handling

Use `onChange` on `isOnline$` to react whenever the network status changes.

```tsx
import { useMount } from "@usels/core";
import { useNetwork } from "@usels/web";

function Component() {
  const { isOnline$ } = useNetwork();

  useMount(() => {
    return isOnline$.onChange(({ value }) => {
      console.log("Network status changed:", value ? "online" : "offline");
    });
  });

  return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
}
```

## Type Declarations

```typescript
export { createNetwork } from "./core";
export type { NetworkType, NetworkEffectiveType, UseNetworkOptions, UseNetworkReturn, } from "./core";
export type UseNetwork = typeof createNetwork;
export declare const useNetwork: UseNetwork;
```

## Source

- Implementation: `packages/web/src/sensors/useNetwork/index.ts`
- Documentation: `packages/web/src/sensors/useNetwork/index.mdx`