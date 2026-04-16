# useOnStartTyping

> Part of `@usels/web` | Category: Sensors

## Overview

Fires a callback when the user starts typing on non-editable elements. Useful for implementing search-on-type or keyboard shortcut activation.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useOnStartTyping } from "@usels/web";
    import { useRef } from "react";

    function SearchOnType() {
      const inputRef = useRef<HTMLInputElement>(null);

      useOnStartTyping((event) => {
        inputRef.current?.focus();
      });

      return <input ref={inputRef} placeholder="Start typing anywhere..." />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$, observable } from "@usels/core";
    import { createOnStartTyping } from "@usels/web";

    function SearchOnType() {
      "use scope"
      const inputRef = createRef$<HTMLInputElement>();

      createOnStartTyping((event) => {
        inputRef.current?.focus();
      });

      return <input ref={inputRef} placeholder="Start typing anywhere..." />;
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createOnStartTyping } from "./core";
export type { OnStartTypingCallback } from "./core";
export declare function useOnStartTyping(callback: (event: KeyboardEvent) => void): void;
```

## Source

- Implementation: `packages/web/src/sensors/useOnStartTyping/index.ts`
- Documentation: `packages/web/src/sensors/useOnStartTyping/index.mdx`