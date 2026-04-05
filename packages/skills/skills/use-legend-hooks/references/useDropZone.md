# useDropZone

> Part of `@usels/web` | Category: Elements

## Overview

Turns any element into a file drop zone. Tracks drag-over state and validates file types before accepting drops.

## Usage

### Basic drop zone

```tsx
import { useRef$, useDropZone } from "@usels/core";

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

### Filter by file type

```tsx
import { useRef$, useDropZone } from "@usels/core";

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
export interface UseDropZoneOptions {
    dataTypes?: string[] | ((types: readonly string[]) => boolean);
    checkValidity?: (items: DataTransferItemList) => boolean;
    onDrop?: (files: File[] | null, event: DragEvent) => void;
    onEnter?: (files: File[] | null, event: DragEvent) => void;
    onLeave?: (files: File[] | null, event: DragEvent) => void;
    onOver?: (files: File[] | null, event: DragEvent) => void;
    multiple?: boolean;
    preventDefaultForUnhandled?: boolean;
}
export interface UseDropZoneReturn {
    files$: Observable<File[] | null>;
    isOverDropZone$: Observable<boolean>;
}
export declare function useDropZone(target: MaybeEventTarget, options?: DeepMaybeObservable<UseDropZoneOptions> | UseDropZoneOptions["onDrop"]): UseDropZoneReturn;
```

## Source

- Implementation: `packages/web/src/elements/useDropZone/index.ts`
- Documentation: `packages/web/src/elements/useDropZone/index.md`