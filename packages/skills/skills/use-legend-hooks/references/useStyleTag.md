# useStyleTag

> Part of `@usels/web` | Category: Browser

## Overview



## Usage

```tsx
import { useStyleTag } from "@usels/web";
```

### Basic — auto-inject on mount

```tsx
import { useStyleTag } from "@usels/web";

function Component() {
  const { isLoaded$ } = useStyleTag("body { background: #f0f0f0; }");

  return <div>{isLoaded$.get() ? "Styles injected" : "Loading..."}</div>;
}
```

### Reactive CSS updates

Update `css$` at any time to change the injected styles without re-mounting.

```tsx
import { useStyleTag } from "@usels/web";

function Component() {
  const { css$, isLoaded$ } = useStyleTag(".box { color: red; }");

  return (
    <div>
      <button onClick={() => css$.set(".box { color: blue; }")}>Change color</button>
      <div className="box">Styled box</div>
    </div>
  );
}
```

### Pass an Observable as CSS

If you already have an Observable holding your CSS string, pass it directly.

```tsx
import { observable } from "@legendapp/state";
import { useStyleTag } from "@usels/web";

const theme$ = observable("body { background: white; }");

function Component() {
  useStyleTag(theme$);
  // Updating theme$ automatically updates the injected style tag
}
```

### Manual control

Set `manual: true` to take full control of when the style tag is injected and removed.

```tsx
import { useStyleTag } from "@usels/web";

function Component() {
  const { load, unload, isLoaded$ } = useStyleTag(".box { color: red; }", {
    manual: true,
  });

  return (
    <div>
      <button onClick={load}>Inject</button>
      <button onClick={unload}>Remove</button>
      <p>{isLoaded$.get() ? "Injected" : "Not injected"}</p>
    </div>
  );
}
```

### With options

```typescript
import { useStyleTag } from "@usels/web";

useStyleTag(".box { color: red; }", {
  id: "my-style", // custom id for the style element
  media: "print", // CSS media query
  nonce: "abc123", // Content Security Policy nonce
  immediate: true, // default: true — inject on mount
  manual: false, // default: false — auto lifecycle management
});
```

## Type Declarations

```typescript
export interface UseStyleTagOptions {
    id?: string;
    media?: string;
    immediate?: boolean;
    manual?: boolean;
    nonce?: string;
    document?: Document;
}
export interface UseStyleTagReturn {
    id: string;
    css$: Observable<string>;
    isLoaded$: ReadonlyObservable<boolean>;
    load: () => void;
    unload: () => void;
}
export declare function useStyleTag(css: MaybeObservable<string>, options?: UseStyleTagOptions): UseStyleTagReturn;
```

## Source

- Implementation: `packages/web/src/browser/useStyleTag/index.ts`
- Documentation: `packages/web/src/browser/useStyleTag/index.md`