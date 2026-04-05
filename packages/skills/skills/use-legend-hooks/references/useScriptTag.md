# useScriptTag

> Part of `@usels/web` | Category: Browser

## Overview



## Usage

```tsx
import { useScriptTag } from "@usels/web";
```

### Basic — auto-load on mount

```tsx
import { useScriptTag } from "@usels/web";

function Component() {
  const { isLoaded$ } = useScriptTag("https://cdn.example.com/lib.js", (el) => {
    console.log("Script loaded", el);
  });

  return <div>{isLoaded$.get() ? "Script loaded" : "Loading..."}</div>;
}
```

### Manual control

Set `manual: true` to take full control of when the script loads and unloads.

```tsx
import { useScriptTag } from "@usels/web";

function Component() {
  const { load, unload, scriptTag$ } = useScriptTag("https://cdn.example.com/lib.js", undefined, {
    manual: true,
  });

  return (
    <div>
      <button onClick={() => load()}>Load</button>
      <button onClick={() => unload()}>Unload</button>
      <p>Status: {isLoaded$.get() ? "loaded" : "not loaded"}</p>
    </div>
  );
}
```

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
export interface UseScriptTagOptions {
    immediate?: boolean;
    async?: boolean;
    type?: string;
    manual?: boolean;
    crossOrigin?: "anonymous" | "use-credentials";
    referrerPolicy?: ReferrerPolicy;
    noModule?: boolean;
    defer?: boolean;
    attrs?: Record<string, string>;
    nonce?: string;
    document?: Document;
}
export interface UseScriptTagReturn {
    scriptTag$: ReadonlyObservable<HTMLScriptElement | null>;
    isLoaded$: ReadonlyObservable<boolean>;
    load: (waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>;
    unload: () => void;
}
export declare function useScriptTag(src: MaybeObservable<string>, onLoaded?: (el: HTMLScriptElement) => void, options?: UseScriptTagOptions): UseScriptTagReturn;
```

## Source

- Implementation: `packages/web/src/browser/useScriptTag/index.ts`
- Documentation: `packages/web/src/browser/useScriptTag/index.md`