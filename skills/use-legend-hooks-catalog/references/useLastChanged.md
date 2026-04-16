# useLastChanged

> Part of `@usels/core` | Category: Reactivity

## Overview

A hook that tracks when a source Observable last changed. Returns a read-only Observable containing the `Date.now()` timestamp of the most recent change, or `null` if the source has not changed yet.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useLastChanged, useObservable } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);
      const lastChanged$ = useLastChanged(count$);

      // null before any change, Date.now() timestamp after
      return <div>{lastChanged$.get()}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createLastChanged, observable } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);
      const { timestamp$ } = createLastChanged(count$);

      return <div>{timestamp$.get()}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### initialValue — custom initial timestamp

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useLastChanged, useObservable } from "@usels/core";

    function Component() {
      const count$ = useObservable(0);
      // Start with a known timestamp instead of null
      const lastChanged$ = useLastChanged(count$, Date.now());
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createLastChanged, observable } from "@usels/core";

    function Component() {
      "use scope"
      const count$ = observable(0);
      const { timestamp$ } = createLastChanged(count$, Date.now());
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createLastChanged, type LastChangedOptions } from "./core";
export type UseLastChanged = typeof createLastChanged;
export declare const useLastChanged: UseLastChanged;
```

## Source

- Implementation: `packages/core/src/state/useLastChanged/index.ts`
- Documentation: `packages/core/src/state/useLastChanged/index.mdx`