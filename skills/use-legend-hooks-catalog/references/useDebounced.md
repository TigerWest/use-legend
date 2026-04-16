# useDebounced

> Part of `@usels/core` | Category: Reactivity

## Overview

Debounce an Observable value. Creates a read-only Observable that updates only after the source value stops changing for the specified delay.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useDebounced, useObservable } from "@usels/core";

    function Component() {
      const source$ = useObservable("hello");
      const debounced$ = useDebounced(source$, { ms: 300 });
      // debounced$.get() updates 300ms after source$ stops changing
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDebounced, observable } from "@usels/core";

    function Component() {
      "use scope"
      const source$ = observable("hello");
      const debounced$ = createDebounced(source$, { ms: 300 });
    }
    ```

  </Fragment>
</CodeTabs>

### maxWait — cap maximum delay

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useDebounced, useObservable } from "@usels/core";

    function Component() {
      const source$ = useObservable(0);
      const debounced$ = useDebounced(source$, { ms: 300, maxWait: 1000 });
      // Forces update every 1000ms even with continuous source changes
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDebounced, observable } from "@usels/core";

    function Component() {
      "use scope"
      const source$ = observable(0);
      const debounced$ = createDebounced(source$, { ms: 300, maxWait: 1000 });
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createDebounced, type DebouncedOptions } from "./core";
export type { DebouncedOptions as UseDebouncedOptions } from "./core";
export type UseDebounced = typeof createDebounced;
export declare const useDebounced: UseDebounced;
```

## Source

- Implementation: `packages/core/src/reactivity/useDebounced/index.ts`
- Documentation: `packages/core/src/reactivity/useDebounced/index.mdx`