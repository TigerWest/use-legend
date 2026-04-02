# useDebouncedHistory

> Part of `@usels/core` | Category: Reactivity

## Overview

A hook that tracks Observable change history with debounce. A thin wrapper around `useHistory` with `debounceFilter` applied — it only records history after typing has stopped. Ideal for text inputs or search fields where you want to snapshot only when a burst of changes has "settled".

## Usage

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebouncedHistory } from "@usels/core";

const search$ = useObservable("");

// Record a snapshot 500ms after the user stops typing
const { undo, redo, canUndo$ } = useDebouncedHistory(search$, { debounce: 500 });
```

### maxWait — force commit after maximum delay

Even if the user keeps typing, a snapshot is forced after `maxWait` ms.

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebouncedHistory } from "@usels/core";

const text$ = useObservable("");

// Commit after 500ms idle, or every 2s at most even if still typing
const { undo, redo } = useDebouncedHistory(text$, {
  debounce: 500,
  maxWait: 2000,
});
```

### Combined with capacity

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebouncedHistory } from "@usels/core";

const note$ = useObservable("");

const { undo, redo } = useDebouncedHistory(note$, {
  debounce: 800,
  capacity: 30,
});
```

## Type Declarations

```typescript
export { createDebouncedHistory, type DebouncedHistoryOptions } from "./core";
export type UseDebouncedHistoryOptions<Raw, Serialized = Raw> = Omit<UseHistoryOptions<Raw, Serialized>, "eventFilter"> & {
    debounce?: MaybeObservable<number>;
    maxWait?: MaybeObservable<number>;
};
export type UseDebouncedHistoryReturn<Raw, Serialized = Raw> = UseHistoryReturn<Raw, Serialized>;
export declare function useDebouncedHistory<Raw, Serialized = Raw>(source$: Observable<Raw>, options?: DeepMaybeObservable<UseDebouncedHistoryOptions<Raw, Serialized>>): UseDebouncedHistoryReturn<Raw, Serialized>;
```

## Source

- Implementation: `packages/core/src/state/useDebouncedHistory/index.ts`
- Documentation: `packages/core/src/state/useDebouncedHistory/index.md`