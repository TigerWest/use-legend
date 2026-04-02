# useWhenever

> Part of `@usels/core` | Category: Observe

## Overview

Shorthand for watching a source and running an effect only when the value is truthy. Built on `watch` — lazy by default (`immediate: false`).

## Usage

```tsx
import { useWhenever } from "@usels/core";
import { observable } from "@legendapp/state";

const isReady$ = observable(false);

// ✅ Effect only runs when isReady$ is truthy
useWhenever(isReady$, (value) => {
  console.log("ready:", value);
});
```

### Eager mode (`immediate: true`)

Pass `immediate: true` to also fire on setup if the value is already truthy.

```tsx
import { useWhenever } from "@usels/core";
import { observable } from "@legendapp/state";

const isReady$ = observable(true);

useWhenever(
  isReady$,
  (value) => {
    console.log("value:", value);
  },
  { immediate: true } // fires immediately since isReady$ is truthy
);
```

### Once (`once: true`)

Dispose the watcher automatically after the first truthy invocation.

```tsx
import { useWhenever } from "@usels/core";
import { observable } from "@legendapp/state";

const token$ = observable<string | null>(null);

// ✅ Only fires the first time token$ becomes truthy
useWhenever(
  () => token$.get(),
  (token) => {
    console.log("got token:", token);
  },
  { once: true }
);
```

### Reactive function selector

Use a function to derive a truthy/falsy value from one or more observables.

```tsx
import { useWhenever } from "@usels/core";
import { observable } from "@legendapp/state";

const user$ = observable<{ name: string } | null>(null);

useWhenever(
  () => user$.get(),
  (user) => {
    console.log("user logged in:", user.name);
  }
);
```

### Batch scheduling (`schedule`)

The `schedule` option controls when the effect runs relative to Legend-State's batch cycle.

- `schedule: 'sync'` — runs synchronously inside the batch
- `schedule: 'deferred'` — runs after the batch ends
- omitted — uses Legend-State's default batching

```typescript
useWhenever(flag$, (v) => console.log(v), { schedule: "sync" });
```

## Type Declarations

```typescript
export { whenever, type WheneverOptions, type Truthy } from "./core";
export type UseWheneverOptions = WheneverOptions;
export declare function useWhenever<T>(selector: Selector<T>, effect: (value: Truthy<T>) => void, options?: UseWheneverOptions): void;
```

## Source

- Implementation: `packages/core/src/observe/useWhenever/index.ts`
- Documentation: `packages/core/src/observe/useWhenever/index.md`