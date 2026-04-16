# useCssVar

> Part of `@usels/web` | Category: Browser

## Overview

Reactively read and write CSS custom properties (CSS variables) on DOM elements.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$, useCssVar } from "@usels/web";

    function Component() {
      const el$ = useRef$<HTMLDivElement>();
      const color$ = useCssVar("--color", el$);

      // Read the value
      color$.get(); // → "#7fa998"

      // Set the value
      color$.set("#df8543");

      return <div ref={el$} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createCssVar } from "@usels/web";

    function Component() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const color$ = createCssVar("--color", el$);

      color$.get();
      color$.set("#df8543");

      return <div ref={el$} />;
    }
    ```

  </Fragment>
</CodeTabs>

### Default to documentElement

When no target is provided, `useCssVar` operates on `document.documentElement`.

```tsx
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

## Type Declarations

```typescript
export { createCssVar } from "./core";
export type { UseCssVarOptions, UseCssVarReturn } from "./core";
export type UseCssVar = typeof createCssVar;
export declare const useCssVar: UseCssVar;
```

## Source

- Implementation: `packages/web/src/browser/useCssVar/index.ts`
- Documentation: `packages/web/src/browser/useCssVar/index.mdx`