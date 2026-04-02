# useWatch

> Part of `@usels/core` | Category: Observe

## Overview

Runs a reactive effect that skips the first effect execution by default (lazy mode). Pass `immediate: true` to execute the effect immediately on setup (eager mode). The selector always tracks dependencies; the effect is suppressed on the initial call unless `immediate: true`.

## Usage

```tsx
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");

// ✅ Lazy (default) — runs only when query$ changes
useWatch(query$, (value) => {
  console.log("search:", value);
});
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to execute the effect immediately on setup, in addition to triggering on source changes.

```tsx
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");

// ✅ Also executes the effect immediately with the initial value
useWatch(
  query$,
  (value) => {
    console.log("value:", value);
  },
  { immediate: true }
);
```

### Array of observables

Watch multiple sources at once. The effect receives a tuple of current values.

```tsx
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const query$ = observable("");
const page$ = observable(1);

useWatch([query$, page$], ([query, page]) => {
  console.log("fetch page", page, "for query:", query);
});
```

### Reactive function selector

Use a function to compute a derived value. The function runs on every dep change to maintain tracking; the effect receives the computed result.

```tsx
import { useWatch } from "@usels/core";
import { observable } from "@legendapp/state";

const firstName$ = observable("John");
const lastName$ = observable("Doe");

useWatch(
  () => `${firstName$.get()} ${lastName$.get()}`,
  (fullName) => {
    console.log("name changed:", fullName);
  }
);
```

### Batch scheduling (`schedule`)

The `schedule` option controls when the effect runs relative to Legend-State's batch cycle.

- `schedule: 'sync'` — runs synchronously inside the batch (equivalent to Legend-State `immediate: true`)
- `schedule: 'deferred'` — runs after the batch ends (equivalent to Legend-State `immediate: false`)
- omitted — uses Legend-State's default batching

```typescript
useWatch(count$, (v) => console.log(v), { schedule: "sync" });
```

## Type Declarations

```typescript
export { watch, type WatchOptions, type WatchSource, type Effector } from "./core";
export type UseWatchOptions = WatchOptions;
export declare function useWatch<T extends WatchSource>(selector: T, effect: Effector<T>, options?: UseWatchOptions): void;
```

## Source

- Implementation: `packages/core/src/observe/useWatch/index.ts`
- Documentation: `packages/core/src/observe/useWatch/index.md`