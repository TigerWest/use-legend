---
title: useManualHistory
category: Reactivity
---

A hook for manually managing Observable change history. It only records a snapshot when `commit()` is called, and allows navigating previous states via `undo`/`redo`.
Useful when auto-tracking is not needed, or when you want to record history only on explicit "save" actions.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useManualHistory } from "@usels/core";

const counter$ = useObservable(0);
const { commit, undo, redo, canUndo$, canRedo$ } = useManualHistory(counter$);

counter$.set(1);
commit(); // snapshot: 1

counter$.set(2);
commit(); // snapshot: 2

undo(); // counter$ → 1
redo(); // counter$ → 2
```

### capacity — limit history size

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useManualHistory } from "@usels/core";

const value$ = useObservable(0);

// Keep at most 10 undo steps; older records are discarded automatically
const { commit, undo } = useManualHistory(value$, { capacity: 10 });
```

### dump / parse — custom serialization

Use `dump` and `parse` to store a compact or transformed representation instead of raw value clones.

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useManualHistory } from "@usels/core";

const items$ = useObservable<string[]>([]);

const { commit, undo, history$ } = useManualHistory(items$, {
  // Store as comma-separated string to save memory
  dump: (arr) => arr.join(","),
  parse: (str) => (str ? str.split(",") : []),
});

items$.set(["a", "b", "c"]);
commit(); // stored as "a,b,c"

undo(); // restored to ["a", "b", "c"]
```

### reset — revert uncommitted changes

`reset()` restores the source to the last committed value without touching the undo/redo stacks.

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useManualHistory } from "@usels/core";

const text$ = useObservable("saved");
const { commit, reset } = useManualHistory(text$);

commit(); // snapshot: "saved"
text$.set("unsaved"); // uncommitted edit
reset(); // text$ → "saved" (stacks unchanged)
```

### clear — wipe all history

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useManualHistory } from "@usels/core";

const value$ = useObservable(0);
const { commit, clear, history$ } = useManualHistory(value$);

value$.set(1);
commit();
value$.set(2);
commit();

clear(); // history$ → [{ snapshot: 2, timestamp: ... }], stacks empty
```
