---
title: useCssVar
description: Reactively read and write CSS custom properties (CSS variables) on DOM elements.
category: Browser
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useCssVar } from "@usels/web";
import { useRef$ } from "@usels/web";

const el$ = useRef$<HTMLDivElement>();
const color$ = useCssVar("--color", el$);

// Read the value
color$.get(); // → "#7fa998"

// Set the value
color$.set("#df8543");
```

### Default to documentElement

When no target is provided, `useCssVar` operates on `document.documentElement`.

```tsx
// @noErrors
import { useCssVar } from "@usels/web";

const theme$ = useCssVar("--theme-color");
theme$.get(); // reads from :root
theme$.set("#ff0000"); // sets on :root
```

### With initialValue

```typescript
import { useCssVar } from "@usels/web";

const color$ = useCssVar("--color", el$, { initialValue: "#000000" });
```

### With MutationObserver

Use `observe: true` to re-read the CSS variable when the element's `style` or `class` attributes change externally.

```typescript
import { useCssVar } from "@usels/web";

const color$ = useCssVar("--color", el$, { observe: true });
```
