# useOnline

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive online state. A thin wrapper around [`useNetwork`](/web/sensors/useNetwork) that returns only the `isOnline Observable.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useOnline } from "@usels/web";

    function Component() {
      const isOnline$ = useOnline();

      return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createOnline } from "@usels/web";

    function Component() {
      "use scope"
      const isOnline$ = createOnline();

      return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### With `onChange` callback

Use `onChange` on the returned Observable to react to network status changes.

```tsx
import { useMount } from "@usels/core";
import { useOnline } from "@usels/web";

function Component() {
  const isOnline$ = useOnline();

  useMount(() => {
    return isOnline$.onChange(({ value }) => {
      console.log(value ? "Back online" : "Gone offline");
    });
  });

  return <div>{isOnline$.get() ? "Online" : "Offline"}</div>;
}
```

## Type Declarations

```typescript
export { createOnline } from "./core";
export type { UseOnlineOptions, UseOnlineReturn } from "./core";
export type UseOnline = typeof createOnline;
export declare const useOnline: UseOnline;
```

## Source

- Implementation: `packages/web/src/sensors/useOnline/index.ts`
- Documentation: `packages/web/src/sensors/useOnline/index.mdx`