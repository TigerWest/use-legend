---
title: useFocusWithin
description: "Reactive utility that tracks whether focus is within a container element or any of its descendants. Works like the CSS `:focus-within` pseudo-class but as a reactive `Observable<boolean>`."
category: sensors
sidebar:
  order: 5
---

## Demo

## Usage

```tsx twoslash
// @noErrors
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

### Conditional Styling

Use `focused$` to conditionally apply styles when any descendant has focus.

```tsx
// @noErrors
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
