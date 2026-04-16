# useScriptTag

> Part of `@usels/web` | Category: Browser

## Overview

Dynamically load and unload an external script tag. The script is appended to `document.head` on mount and removed on unmount. Supports promise-based control, deduplication of identical scripts, and optional manual lifecycle management.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useScriptTag } from "@usels/web";

    function Component() {
      const { isLoaded$ } = useScriptTag("https://cdn.example.com/lib.js", (el) => {
        console.log("Script loaded", el);
      });

      return <div>{isLoaded$.get() ? "Script loaded" : "Loading..."}</div>;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createScriptTag } from "@usels/web";

    function Component() {
      "use scope"
      const { isLoaded$ } = createScriptTag("https://cdn.example.com/lib.js", (el) => {
        console.log("Script loaded", el);
      });

      return <div>{isLoaded$.get() ? "Script loaded" : "Loading..."}</div>;
    }
    ```

  </Fragment>
</CodeTabs>

### Manual control

Set `manual: true` to take full control of when the script loads and unloads.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useScriptTag } from "@usels/web";

    function Component() {
      const { load, unload, isLoaded$ } = useScriptTag(
        "https://cdn.example.com/lib.js",
        undefined,
        { manual: true }
      );

      return (
        <div>
          <button onClick={() => load()}>Load</button>
          <button onClick={() => unload()}>Unload</button>
          <p>Status: {isLoaded$.get() ? "loaded" : "not loaded"}</p>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createScriptTag } from "@usels/web";

    function Component() {
      "use scope"
      const { load, unload, isLoaded$ } = createScriptTag(
        "https://cdn.example.com/lib.js",
        undefined,
        { manual: true }
      );

      return (
        <div>
          <button onClick={() => load()}>Load</button>
          <button onClick={() => unload()}>Unload</button>
          <p>Status: {isLoaded$.get() ? "loaded" : "not loaded"}</p>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Wait for script load

`load()` accepts a `waitForScriptLoad` parameter (default `true`). When `true`, the returned promise resolves only after the script's `load` event fires. Set to `false` to resolve immediately after the element is appended.

```tsx
const { load } = useScriptTag("https://cdn.example.com/lib.js", undefined, { manual: true });

// Resolves after the `load` event fires
await load(true);

// Resolves immediately after appending to DOM
await load(false);
```

### With options

```typescript
import { useScriptTag } from "@usels/web";

useScriptTag("https://cdn.example.com/lib.js", undefined, {
  async: true, // default: true
  defer: false,
  type: "text/javascript", // default: "text/javascript"
  crossOrigin: "anonymous",
  referrerPolicy: "no-referrer",
  nonce: "abc123",
  attrs: { "data-id": "my-lib" },
});
```

## Type Declarations

```typescript
export { createScriptTag } from "./core";
export type { UseScriptTagOptions, UseScriptTagReturn } from "./core";
export type UseScriptTag = typeof createScriptTag;
export declare const useScriptTag: UseScriptTag;
```

## Source

- Implementation: `packages/web/src/browser/useScriptTag/index.ts`
- Documentation: `packages/web/src/browser/useScriptTag/index.mdx`