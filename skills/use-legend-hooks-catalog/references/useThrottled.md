# useThrottled

> Part of `@usels/core` | Category: Reactivity

## Overview

Throttle an Observable value. Creates a read-only Observable that updates at most once per interval when the source value changes.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useObservable, useThrottled } from "@usels/core";

    function Component() {
      const source$ = useObservable("hello");
      const throttled$ = useThrottled(source$, { ms: 300 });
      // throttled$.get() updates at most once per 300ms
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottled, observable } from "@usels/core";

    function Component() {
      "use scope"
      const source$ = observable("hello");
      const throttled$ = createThrottled(source$, { ms: 300 });
    }
    ```

  </Fragment>
</CodeTabs>

### Leading edge only

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useThrottled } from "@usels/core";

    function Component() {
      const source$ = useObservable("hello");
      // Updates immediately on change, suppresses further updates within interval
      const throttled$ = useThrottled(source$, { ms: 300, edges: ["leading"] });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottled, observable } from "@usels/core";

    function Component() {
      "use scope"
      const source$ = observable("hello");
      const throttled$ = createThrottled(source$, { ms: 300, edges: ["leading"] });
    }
    ```

  </Fragment>
</CodeTabs>

### Trailing edge only

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useObservable, useThrottled } from "@usels/core";

    function Component() {
      const source$ = useObservable("hello");
      // Does not update immediately — updates once after the interval ends
      const throttled$ = useThrottled(source$, { ms: 300, edges: ["trailing"] });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createThrottled, observable } from "@usels/core";

    function Component() {
      "use scope"
      const source$ = observable("hello");
      const throttled$ = createThrottled(source$, { ms: 300, edges: ["trailing"] });
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createThrottled, type ThrottledOptions } from "./core";
export type { ThrottledOptions as UseThrottledOptions } from "./core";
export type UseThrottled = typeof createThrottled;
export declare const useThrottled: UseThrottled;
```

## Source

- Implementation: `packages/core/src/reactivity/useThrottled/index.ts`
- Documentation: `packages/core/src/reactivity/useThrottled/index.mdx`