---
title: useHistory
category: Reactivity
---

A hook that automatically tracks changes to an Observable and manages undo/redo history.
Records a snapshot automatically whenever the source Observable changes. Built on top of `useManualHistory`, with additional support for auto-commit, pause/resume, and transaction.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useHistory } from "@usels/core";

const text$ = useObservable("hello");
const { undo, redo, canUndo$, canRedo$ } = useHistory(text$);

text$.set("world"); // auto-committed
undo(); // text$ → "hello"
redo(); // text$ → "world"
```

### pause / resume — stop and restart auto-tracking

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useHistory } from "@usels/core";

const text$ = useObservable("hello");
const { pause, resume, isTracking$ } = useHistory(text$);

pause();
text$.set("not tracked"); // skipped — no history record

resume();
text$.set("tracked again"); // auto-committed

// Resume and immediately commit the current value
resume(true);
```

### transaction — group mutations into one record

Multiple changes inside `transaction()` are recorded as a single undo step.
Call the provided `cancel()` to abort the commit entirely.

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useHistory } from "@usels/core";

const value$ = useObservable(0);
const { transaction, undo } = useHistory(value$);

transaction((cancel) => {
  value$.set(1);
  value$.set(2);
  value$.set(3);
  // Only one history record for the final value 3
});

undo(); // value$ → 0 (single step back)
```

### shouldCommit — conditional auto-commit

Return `false` from `shouldCommit` to skip recording specific values.

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useHistory } from "@usels/core";

const count$ = useObservable(0);

// Only record even numbers
const { undo } = useHistory(count$, {
  shouldCommit: (value) => value % 2 === 0,
});
```

### capacity — limit undo depth

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useHistory } from "@usels/core";

const text$ = useObservable("");

// Keep at most 50 undo steps
const { undo, redo } = useHistory(text$, { capacity: 50 });
```

### dispose — permanently stop tracking

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useHistory } from "@usels/core";

const value$ = useObservable(0);
const { dispose } = useHistory(value$);

dispose(); // stops auto-tracking permanently; undo/redo stacks still usable
```
