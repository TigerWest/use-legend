---
name: use-legend-create-custom-hook
description: Use when building a custom reactive utility for an app using @usels/core — decides between "use scope" core-only style vs traditional 2-layer hook+core style and shows the pattern for each
---

# Creating a Custom Hook with @usels/core

## Overview

Use this skill when your app needs a reusable reactive utility that wraps observables, timers, event listeners, or derived state. Pick the style based on how the rest of the app consumes reactivity.

## Decision — Style A vs Style B

| Primary app style | Choose |
|---|---|
| Components/functions that use the `"use scope"` directive | **Style A — core-only** (`createX` only) |
| Components that only use React hooks (`useX()`) | **Style B — 2-layer** (`createX` + `useX` wrapper) |
| Publishing a utility others will consume both ways | Style B |

## Style A — Core-only (`"use scope"` consumers)

Inside a `"use scope"` block, call `createX(...)` directly. No React hook wrapper needed.

```ts
import { observable, type Observable } from "@legendapp/state";
import { observe, onUnmount } from "@usels/core";

interface DebouncedOptions {
  maxWait?: number;
}

export function createDebounced<T>(
  source$: Observable<T>,
  delay: number,
  options?: DebouncedOptions
): { value$: Observable<T> } {
  const opts$ = observable(options);
  const value$ = observable<T>(source$.peek());
  let timer: ReturnType<typeof setTimeout> | undefined;

  observe(() => {
    const val = source$.get();
    clearTimeout(timer);
    timer = setTimeout(() => value$.set(val), delay);
  });

  onUnmount(() => clearTimeout(timer));
  return { value$ };
}
```

Consumer usage:

```tsx
function MyComponent() {
  "use scope";
  const text$ = observable("");
  const { value$ } = createDebounced(text$, 200);
  return <input onChange={(e) => text$.set(e.target.value)} />;
}
```

## Style B — 2-layer (traditional hook consumers)

Wrap the core function with `useScope` + `toObs`. `toObs(p)` converts the ReactiveProps proxy into an `Observable<Props>` that flows reactively into the core.

```ts
import { useScope, toObs } from "@usels/core";
import { createDebounced, type DebouncedOptions } from "./createDebounced";
import type { Observable } from "@legendapp/state";

export type UseDebounced = typeof createDebounced;

export const useDebounced: UseDebounced = (source$, delay, options) => {
  return useScope(
    (scalars, opts) => {
      const scalars$ = toObs(scalars);
      const opts$ = toObs(opts);
      return createDebounced(
        source$,
        scalars$.delay.get() as number,
        opts$.get()
      );
    },
    { delay },
    options
  );
};
```

## Parameter-shape matrix

| Shape you accept | Pass to `useScope` how |
|---|---|
| `source$: Observable<T>` | Pass as-is: `useScope((p) => ..., source$)` |
| `scalar: number \| string \| boolean \| Fn` | Wrap: `useScope((p) => ..., { value: scalar })` |
| `options?: DeepMaybeObservable<Options>` | Pass as-is: `useScope((p) => ..., options)` |
| Multiple params | Each as its own `useScope` arg — do NOT merge primitives into the options object |

## Lifecycle primitives (Style A and B)

| API | Use for |
|---|---|
| `observe(() => …)` | Reactive re-run, auto-cleanup on scope dispose |
| `onMount(() => cleanup?)` | Post-mount setup, optional cleanup return |
| `onUnmount(() => …)` | Teardown only |
| `onBeforeMount(() => …)` | Layout-effect timing, before paint |

All imported from `@usels/core`.

## Avoid

- Calling React hooks (`useState`, `useEffect`, etc.) inside a `useScope` factory. Put that logic in `createX` using `observe`/`onMount` instead.
- Calling `.peek()` on `options` *before* `useScope`. Always pass `options` through; peek inside the factory if a mount-time snapshot is needed.
- Returning a `dispose` function from `createX` when the scope already runs. Use `onUnmount(…)` — the scope disposes it.
- Forgetting the `$` suffix on Observable return fields.
