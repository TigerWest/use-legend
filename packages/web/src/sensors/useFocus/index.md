---
title: useFocus
description: "Reactive utility that tracks whether a DOM element has focus, with two-way binding — read the current focus state and programmatically focus or blur the element."
category: Sensors
sidebar:
  order: 5
---

## Demo

## Usage

```tsx twoslash
// @noErrors
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

### Auto Focus on Mount

Set `initialValue: true` to automatically focus the element when the component mounts.

```tsx
// @noErrors
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
// @noErrors
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
