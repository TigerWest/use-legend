# useDropZone

> Part of `@usels/web` | Category: Elements

## Overview

Turns any element into a file drop zone. Tracks drag-over state and validates file types before accepting drops.

## Usage

### Basic drop zone

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useRef$ } from "@usels/core";
    import { useDropZone } from "@usels/web";

    function MyDropZone() {
      const el$ = useRef$<HTMLDivElement>();
      const { files$, isOverDropZone$ } = useDropZone(el$, {
        onDrop: (files) => console.log(files),
      });

      return (
        <div ref={el$} style={{ background: isOverDropZone$.get() ? "#e0e7ff" : "#f9fafb" }}>
          Drop files here
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createRef$ } from "@usels/core";
    import { createDropZone } from "@usels/web";

    function MyDropZone() {
      "use scope";
      const el$ = createRef$<HTMLDivElement>();
      const { files$, isOverDropZone$ } = createDropZone(el$, {
        onDrop: (files) => console.log(files),
      });

      return (
        <div ref={el$} style={{ background: isOverDropZone$.get() ? "#e0e7ff" : "#f9fafb" }}>
          Drop files here
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Filter by file type

```tsx
import { useRef$ } from "@usels/core";
import { useDropZone } from "@usels/web";

function ImageDropZone() {
  const el$ = useRef$<HTMLDivElement>();
  const { files$ } = useDropZone(el$, {
    dataTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  // ...
}
```

### Custom validation

```typescript
const { files$ } = useDropZone(el$, {
  checkValidity: (items) => Array.from(items).every((item) => item.type.startsWith("image/")),
});
```

### Single file only

```typescript
const { files$ } = useDropZone(el$, {
  multiple: false,
  onDrop: (files) => files && uploadFile(files[0]),
});
```

### Shorthand (onDrop only)

```typescript
const { files$ } = useDropZone(el$, (files, event) => {
  if (files) processFiles(files);
});
```

## Type Declarations

```typescript
export { createDropZone } from "./core";
export type { UseDropZoneOptions, UseDropZoneReturn } from "./core";
export type UseDropZone = typeof createDropZone;
export declare function useDropZone(target: MaybeEventTarget, options?: DeepMaybeObservable<UseDropZoneOptions> | UseDropZoneOptions["onDrop"]): UseDropZoneReturn;
```

## Source

- Implementation: `packages/web/src/elements/useDropZone/index.ts`
- Documentation: `packages/web/src/elements/useDropZone/index.mdx`