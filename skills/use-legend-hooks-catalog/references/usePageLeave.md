# usePageLeave

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively detects when the mouse cursor leaves the page. Useful for showing exit-intent popups, saving progress, or pausing animations when the user moves their cursor outside the browser viewport.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { usePageLeave } from "@usels/web";

    function PageLeaveDetector() {
      const isLeft$ = usePageLeave();

      return <p>Mouse left the page: {isLeft$.get() ? "Yes" : "No"}</p>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createPageLeave } from "@usels/web";

    function PageLeaveDetector() {
      "use scope"
      const isLeft$ = createPageLeave();

      return <p>Mouse left the page: {isLeft$.get() ? "Yes" : "No"}</p>;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createPageLeave } from "./core";
export type { UsePageLeaveOptions } from "./core";
export type UsePageLeave = typeof createPageLeave;
export declare const usePageLeave: UsePageLeave;
```

## Source

- Implementation: `packages/web/src/sensors/usePageLeave/index.ts`
- Documentation: `packages/web/src/sensors/usePageLeave/index.mdx`