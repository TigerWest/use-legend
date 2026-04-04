---
title: useScriptTag
category: Browser
---

Dynamically load and unload an external script tag. The script is appended to `document.head` on mount and removed on unmount. Supports promise-based control, deduplication of identical scripts, and optional manual lifecycle management.

## Demo

## Usage

```tsx twoslash
// @noErrors
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
