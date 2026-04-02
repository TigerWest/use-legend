---
title: useDebouncedHistory
category: Reactivity
---

A hook that tracks Observable change history with debounce.
A thin wrapper around `useHistory` with `debounceFilter` applied — it only records history after typing has stopped. Ideal for text inputs or search fields where you want to snapshot only when a burst of changes has "settled".

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useDebouncedHistory } from "@usels/core";

const search$ = useObservable("");

// Record a snapshot 500ms after the user stops typing
const { undo, redo, canUndo$ } = useDebouncedHistory(search$, { debounce: 500 });
```

### maxWait — force commit after maximum delay

Even if the user keeps typing, a snapshot is forced after `maxWait` ms.

```tsx
// @noErrors
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
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useDebouncedHistory } from "@usels/core";

const note$ = useObservable("");

const { undo, redo } = useDebouncedHistory(note$, {
  debounce: 800,
  capacity: 30,
});
```
