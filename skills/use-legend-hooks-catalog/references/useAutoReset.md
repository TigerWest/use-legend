# useAutoReset

> Part of `@usels/core` | Category: Reactivity

## Overview

Observable that automatically resets to a default value after a specified delay. Useful for temporary state like toast messages, form feedback, or UI status indicators. Each time the value changes, the reset timer restarts.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useAutoReset, useObservable } from "@usels/core";

    function Component() {
      const default$ = useObservable("");
      const message$ = useAutoReset(default$, { afterMs: 2000 });

      message$.set("Saved!");
      // message$.get() returns "Saved!" immediately
      // After 2 seconds, message$.get() returns "" automatically
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createAutoReset, observable } from "@usels/core";

    function Component() {
      "use scope"
      const default$ = observable("");
      const message$ = createAutoReset(default$, { afterMs: 2000 });

      message$.set("Saved!");
      // After 2 seconds, resets to ""
    }
    ```

  </Fragment>
</CodeTabs>

### Boolean flag auto-reset

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useAutoReset, useObservable } from "@usels/core";

    function Component() {
      const default$ = useObservable(false);
      const showCopied$ = useAutoReset(default$, { afterMs: 1500 });

      const handleCopy = () => {
        navigator.clipboard.writeText("text");
        showCopied$.set(true);
        // Automatically resets to false after 1.5s
      };
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createAutoReset, observable } from "@usels/core";

    function Component() {
      "use scope"
      const default$ = observable(false);
      const showCopied$ = createAutoReset(default$, { afterMs: 1500 });

      const handleCopy = () => {
        navigator.clipboard.writeText("text");
        showCopied$.set(true);
      };
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createAutoReset, type AutoResetOptions } from "./core";
export type { AutoResetOptions as UseAutoResetOptions } from "./core";
export type UseAutoReset = typeof createAutoReset;
export declare const useAutoReset: UseAutoReset;
```

## Source

- Implementation: `packages/core/src/reactivity/useAutoReset/index.ts`
- Documentation: `packages/core/src/reactivity/useAutoReset/index.mdx`