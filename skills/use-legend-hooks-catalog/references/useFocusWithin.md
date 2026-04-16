# useFocusWithin

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive utility that tracks whether focus is within a container element or any of its descendants. Works like the CSS `:focus-within` pseudo-class but as a reactive `Observable<boolean>`.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useFocusWithin } from "@usels/web";

    function MyForm() {
      const form$ = useRef$<HTMLFormElement>();
      const { focused$ } = useFocusWithin(form$);

      return (
        <form ref={form$}>
          <input placeholder="Name" />
          <input placeholder="Email" />
          <p>Form has focus: {focused$.get() ? "Yes" : "No"}</p>
        </form>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createFocusWithin } from "@usels/web";

    function MyForm() {
      "use scope"
      const form$ = createRef$<HTMLFormElement>();
      const { focused$ } = createFocusWithin(form$);

      return (
        <form ref={form$}>
          <input placeholder="Name" />
          <input placeholder="Email" />
          <p>Form has focus: {focused$.get() ? "Yes" : "No"}</p>
        </form>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Conditional Styling

Use `focused$` to conditionally apply styles when any descendant has focus.

```tsx
import { useRef$ } from "@usels/core";
import { useFocusWithin } from "@usels/web";

function HighlightedForm() {
  const container$ = useRef$<HTMLDivElement>();
  const { focused$ } = useFocusWithin(container$);

  return (
    <div
      ref={container$}
      style={{
        outline: focused$.get() ? "2px solid blue" : "none",
        padding: "16px",
      }}
    >
      <input placeholder="Focus me" />
      <button>Or me</button>
    </div>
  );
}
```

## Type Declarations

```typescript
export { createFocusWithin } from "./core";
export type { UseFocusWithinReturn } from "./core";
export type UseFocusWithin = typeof createFocusWithin;
export declare const useFocusWithin: UseFocusWithin;
```

## Source

- Implementation: `packages/web/src/sensors/useFocusWithin/index.ts`
- Documentation: `packages/web/src/sensors/useFocusWithin/index.mdx`