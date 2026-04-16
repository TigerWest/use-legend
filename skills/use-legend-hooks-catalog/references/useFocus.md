# useFocus

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive utility that tracks whether a DOM element has focus, with two-way binding — read the current focus state and programmatically focus or blur the element.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useFocus } from "@usels/web";

    function Component() {
      const input$ = useRef$<HTMLInputElement>();
      const { focused$ } = useFocus(input$);

      return (
        <div>
          <input ref={input$} placeholder="Click to focus" />
          <p>Focused: {focused$.get() ? "Yes" : "No"}</p>
          <button onClick={() => focused$.set(true)}>Focus</button>
          <button onClick={() => focused$.set(false)}>Blur</button>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createFocus } from "@usels/web";

    function Component() {
      "use scope"
      const input$ = createRef$<HTMLInputElement>();
      const { focused$ } = createFocus(input$);

      return (
        <div>
          <input ref={input$} placeholder="Click to focus" />
          <p>Focused: {focused$.get() ? "Yes" : "No"}</p>
          <button onClick={() => focused$.set(true)}>Focus</button>
          <button onClick={() => focused$.set(false)}>Blur</button>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Auto Focus on Mount

Set `initialValue: true` to automatically focus the element when the component mounts.

```tsx
import { useRef$ } from "@usels/core";
import { useFocus } from "@usels/web";

function AutoFocusInput() {
  const input$ = useRef$<HTMLInputElement>();
  const { focused$ } = useFocus(input$, { initialValue: true });
  return <input ref={input$} />;
}
```

### Focus Visible

When `focusVisible: true`, only tracks focus that would show a visible focus indicator
(matching the CSS `:focus-visible` pseudo-class). Mouse clicks won't trigger `focused$`,
but keyboard navigation (Tab) will.

```tsx
import { useRef$ } from "@usels/core";
import { useFocus } from "@usels/web";

function FocusVisibleButton() {
  const btn$ = useRef$<HTMLButtonElement>();
  const { focused$ } = useFocus(btn$, { focusVisible: true });
  return <button ref={btn$}>Tab to me</button>;
}
```

### Prevent Scroll

Pass `preventScroll: true` to prevent the browser from scrolling to the element when programmatically focused.

```typescript
const { focused$ } = useFocus(el$, { preventScroll: true });
focused$.set(true); // focuses without scrolling
```

## Type Declarations

```typescript
export { createFocus } from "./core";
export type { UseFocusOptions, UseFocusReturn } from "./core";
export type UseFocus = typeof createFocus;
export declare const useFocus: UseFocus;
```

## Source

- Implementation: `packages/web/src/sensors/useFocus/index.ts`
- Documentation: `packages/web/src/sensors/useFocus/index.mdx`