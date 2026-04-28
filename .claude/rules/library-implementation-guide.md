---
paths:
  - "packages/core/src/**/*.ts"
  - "packages/web/src/**/*.ts"
  - "packages/integrations/src/**/*.ts"
---

# Library Implementation Guide

## Foundation — 2-Layer Architecture: Core + Hook

Every utility in **core / integrations** follows a **2-layer** structure: a framework-agnostic **core observable function**
and a thin **React hook wrapper**.

### Directory Layout

```
packages/core/src/
  category/
    useMyHook/
      core.ts           # core observable function (createMyHook)
      index.ts          # React hook wrapper (useMyHook)
      index.spec.ts     # tests (validates hook public API)
```

### Core Function Rules

| Rule                                    | Description                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No React**                            | Never import `react` or `@legendapp/state/react`                                                                                                                                                      |
| **`createObserve()` only**                    | Use `createObserve()` from `@primitives/useScope`, not `useObserve()`                                                                                                                                       |
| **Same options type as hook**           | Accept `DeepMaybeObservable<Options>` — the same type the hook receives. Core decides how to consume it.                                                                                              |
| **Reactive read → `opts$.get().field`** | Use `opts$.get().field` inside `createObserve()` or computed observables. Avoids the JSON serialization error that occurs when calling `.get()` on a function-typed child observable (`opts$.field.get()`). |
| **Non-reactive read → `opts$.peek()`**  | Use `opts$.peek()?.field` for construction-time-only reads — no separate `rawOpts` snapshot needed.                                                                                                   |
| **Computed returning functions**        | Wrap returned objects containing functions with `ObservableHint.opaque({...})` to prevent Legend-State from JSON-comparing function values.                                                           |
| **Observable results**                  | Return `Observable<T>` output — no additional wrapping needed in the hook layer.                                                                                                                      |
| **Cleanup via `onUnmount`**             | Register cleanup with `onUnmount()` from `@primitives/useScope` — no need to return `dispose` in the result.                                                                                          |
| **Setup via `onMount`**                 | Register post-mount setup with `onMount()` — return a cleanup function from the callback for setup+cleanup pairs.                                                                                     |
| **Layout setup via `onBeforeMount`**    | Register pre-paint setup with `onBeforeMount()` — useLayoutEffect timing.                                                                                                                             |

```ts
import { type Observable, observable } from "@legendapp/state";
import { createObserve, onUnmount } from "@primitives/useScope";
import type { DeepMaybeObservable } from "../../types";

function createDebounced<T>(
  source$: Observable<T>,
  options?: DeepMaybeObservable<DebounceOptions> // same type as hook
): { value$: Observable<T> } {
  // Needs change detection → wrap with observable(). Auto-derefs plain, per-field, or outer Observable.
  const opts$ = observable(options);
  const value$ = observable<T>(source$.peek());

  createObserve(() => {
    const val = source$.get();
    const ms = opts$.get().delay; // reactive — re-runs when opts$.delay changes
    // debounce logic...
    value$.set(val);
  });

  onUnmount(() => {
    /* cleanup timers, subscriptions, etc. */
  });

  // Construction-time only → peek whole object, then access field (no rawOpts needed)
  // const capacity = opts$.peek()?.capacity;

  return { value$ }; // no dispose — cleanup registered via onUnmount
}
```

### Hook Wrapper Rules

| Rule                        | Description                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **`useScope((p) => ...)`**  | Factory runs exactly once at mount — stable across re-renders                                   |
| **`toObs(p)`**              | Convert ReactiveProps proxy to `Observable<Props>` — prop changes flow reactively into core     |
| **Pass `toObs(p)` to core** | Core accepts `DeepMaybeObservable`, so `Observable<Props>` from `toObs` passes through directly |
| **No `dispose()` needed**   | Cleanup is registered via `onUnmount` inside the scope — hook just returns the factory result   |
| **Preserve public API**     | Return type stays the same — no breaking changes                                                |
| **Lifecycle functions**     | `onMount`, `onUnmount`, `onBeforeMount` are available inside the factory for lifecycle control  |

```ts
import { useScope, toObs } from "@primitives/useScope";
import { createDebounced } from "./core";

export type UseDebounced = typeof createDebounced;
export const useDebounced: UseDebounced = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      // p$ is Observable<Props> — passes directly as DeepMaybeObservable
      // core wraps it with observable(p$) → prop changes propagate reactively
      // Note: callback props don't need a hint — dispatch via raw `p.onX?.()`
      return createDebounced(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
```

### Type Reuse — Derive Hook Types from Core

When the hook's options and return type match the core function exactly, derive them rather than redefining.

```ts
// ❌ Bad — duplicates core types under different names
export interface UseManualHistoryOptions<Raw, Serialized = Raw> {
  capacity?: number;
  dump?: (value: Raw) => Serialized;
  // ... identical to ManualHistoryOptions
}

// ✅ Good — re-export core type
export type { ManualHistoryOptions } from "./core";

// Hook type derived from core function signature
export type UseManualHistory = typeof createManualHistory;
export const useManualHistory: UseManualHistory = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createManualHistory(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
```

This ensures a single source of truth — option and return types never drift between core and hook.

> **Prerequisite:** Core function must not return `dispose` (use `onUnmount` for cleanup instead).
> When `dispose` is absent from the core return, `typeof createX` is a direct match for the hook type.

### Naming Convention

| Layer               | Pattern        | Example                                                      |
| ------------------- | -------------- | ------------------------------------------------------------ |
| Core function       | `createName()` | `createDebounced()`, `createHistory()`, `createIntervalFn()` |
| Core file           | `core.ts`      | in each hook directory                                       |
| Hook                | `useName()`    | `useDebounced()`, `useHistory()`                             |
| Hook file           | `index.ts`     | (existing convention)                                        |
| Observable variable | `name$`        | `value$`, `source$`, `size$`                                 |

#### Exception: `observe` category

Core functions in the `observe` category use `observe*` naming instead of `create*`.
These functions are also exported as public framework-agnostic API, making the `observe` verb more natural.

| Core file                              | Core function         | Hook                     |
| -------------------------------------- | --------------------- | ------------------------ |
| `observe/useWatch/core.ts`             | `watch()`             | `useWatch()`             |
| `observe/useObserveWithFilter/core.ts` | `observeWithFilter()` | `useObserveWithFilter()` |
| `observe/useObserveDebounced/core.ts`  | `observeDebounced()`  | `useObserveDebounced()`  |
| `observe/useObserveThrottled/core.ts`  | `observeThrottled()`  | `useObserveThrottled()`  |

---

## Lifecycle — `useScope`

`useScope` replaces the old `useConstant + useMount/useUnmount` combination with a single scope-based lifecycle.

### Deprecated Hooks

| Old           | Replacement                       |
| ------------- | --------------------------------- |
| `useLatest`   | `p.field` — raw latest from props |
| `useConstant` | `useScope` factory                |

### Lifecycle API

| API             | Import from            | Timing                         |
| --------------- | ---------------------- | ------------------------------ |
| `createObserve` | `@primitives/useScope` | reactive, scope auto-cleanup   |
| `onMount`       | `@primitives/useScope` | useEffect — after mount        |
| `onUnmount`     | `@primitives/useScope` | unmount-only cleanup           |
| `onBeforeMount` | `@primitives/useScope` | useLayoutEffect — before paint |

### Lifecycle Mapping from Old Patterns

| Old pattern                                    | useScope equivalent                           | Timing                       |
| ---------------------------------------------- | --------------------------------------------- | ---------------------------- |
| `useLayoutEffect(() => cb(), [])`              | `onBeforeMount(cb)`                           | layout effect, before paint  |
| `useMount(cb)`                                 | `onMount(cb)`                                 | effect, after mount          |
| `useMount(() => { setup(); return cleanup; })` | `onMount(() => { setup(); return cleanup; })` | setup + cleanup pair         |
| `useUnmount(cb)`                               | `onUnmount(cb)`                               | unmount-only cleanup         |
| `observe()` from `@legendapp/state`            | `createObserve()` from `@primitives/useScope`       | reactive, scope auto-cleanup |

> **`createObserve` import**: Use `createObserve` from `@primitives/useScope`, not `observe` from `@legendapp/state`.
> Only the scoped version is automatically registered for cleanup. The legacy `observe` export from `@usels/core` remains as a deprecated alias of `createObserve` for backwards compatibility.

### `onMount` vs `onUnmount`

```ts
// setup + cleanup pair → return cleanup from onMount
onMount(() => {
  const sub = source$.onChange(handler);
  return () => sub();
});

// cleanup only → use onUnmount
onUnmount(() => {
  result.dispose();
});
```

### `onBeforeMount` Use Cases

Use when DOM measurement or layout-based setup must happen before paint.

```ts
useScope(() => {
  onBeforeMount(() => {
    // useLayoutEffect timing — before paint
    // DOM measurement, scroll position restore, CSS variable setup
  });

  onMount(() => {
    // useEffect timing — after mount
    const sub = source$.onChange(handler);
    return () => sub(); // setup + cleanup pair
  });

  onUnmount(() => {
    // cleanup only
    resource.release();
  });
});
```

> **Note**: `onMount`/`onUnmount` only run inside `useScope`'s `useEffect`.
> They do not fire from a bare `scope.run()` call.

### Related Files

| File                                                     | Role                                    |
| -------------------------------------------------------- | --------------------------------------- |
| `packages/core/src/primitives/useScope/index.ts`         | `useScope` implementation               |
| `packages/core/src/primitives/useScope/effectScope.ts`   | `onMount`, `onUnmount`, `onBeforeMount` |
| `packages/core/src/primitives/useScope/observe.ts`       | scope-aware `createObserve`             |
| `packages/core/src/primitives/useScope/reactiveProps.ts` | `toObs`, `ReactiveProps`                |

---

## Rule 1 — Element Parameters: Use `useRef$` and `MaybeElement`

When a function accepts a DOM element, use `MaybeElement` as the parameter type.
This allows callers to pass a `Ref$` ref, a raw element, or an Observable element.
`MaybeElement` works in **both** core functions and hooks — resolve it via the `get()` / `peek()` utilities from `@utilities/get` and `@utilities/peek` (method form `.get()` / `.peek()` is not available on `MaybeObservable` types).

```ts
// ❌ Bad — raw HTMLElement only
function useMyHook(element: HTMLElement | null) { ... }

// ✅ Good — accepts Ref$, Observable, or raw element
import type { MaybeElement } from "../useRef$";

function useMyHook(element: MaybeElement) { ... }
```

### Resolving MaybeElement Internally

Resolve `MaybeElement` with the `get()` utility (reactive) / `peek()` utility (non-reactive).
Use `isRef$` from `useRef$` only when you need to distinguish `Ref$` from other shapes.

> `MaybeElement` is a `MaybeObservable` union, so the method form `.get()` / `.peek()`
> is not callable on the parameter directly. Import the utility functions from
> `@utilities/get` and `@utilities/peek` instead — they handle plain values,
> Observables, and `Ref$` uniformly.

#### In a Core Function (uses `createObserve`)

```ts
import { get } from "@utilities/get";
import { peek } from "@utilities/peek";

function createElementSize(target: MaybeElement): { size$: Observable<Size> } {
  const size$ = observable({ width: 0, height: 0 });

  createObserve(() => {
    const el = get(target); // reactive tracking registered
    if (!el || !(el instanceof HTMLElement)) return;
    // ResizeObserver setup...
  });

  onUnmount(() => {
    /* disconnect observer */
  });

  return { size$ }; // no dispose — cleanup via onUnmount
}
```

#### In a Hook (uses `useScope`)

```ts
import { get } from "@utilities/get";
import { peek } from "@utilities/peek";
import { isRef$ } from "../useRef$";

function useMyHook(element: MaybeElement) {
  return useScope(() => {
    createObserve(() => {
      // Reactive read — registers tracking dependency on Ref$ or Observable element
      const el = get(element);
      if (el) setup(el);
    });

    // Non-reactive read
    const el = peek(element);
  });
}
```

#### Hook Wrapper — pass MaybeElement directly to core

When wrapping a core function, pass `MaybeElement` as-is — no conversion needed:

```ts
export type UseElementSize = typeof createElementSize;
export const useElementSize: UseElementSize = (target, options) => {
  return useScope(() => createElementSize(target, options));
};
```

### Creating Ref$ Refs in Components

```tsx
import { useRef$ } from "@usels/core";

function MyComponent() {
  const el$ = useRef$<HTMLDivElement>();
  useMyHook(el$);
  return <div ref={el$} />;
}
```

### `ObservableHint.opaque` — Required When Storing Elements in Observables

Legend-State deep-proxies objects by default. Always wrap DOM elements with
`ObservableHint.opaque()` before storing them in an Observable.

```ts
import { ObservableHint } from "@legendapp/state";

// ❌ Bad — Legend-State deep-proxies the HTMLElement
const el$ = observable<HTMLElement | null>(document.querySelector("#root"));

// ✅ Good — opaque() prevents deep-proxying; element→element changes reliable
const el$ = observable<OpaqueObject<HTMLElement> | null>(null);
el$.set(ObservableHint.opaque(document.querySelector("#root")));
```

This is exactly what `useRef$` does internally:

```ts
el$.set(node ? ObservableHint.opaque(node) : null);
```

**`Ref$` (from `useRef$`) is the preferred way to hold reactive element references**
because it handles opaque wrapping automatically.

---

## Rule 2 — Options Parameters: Core vs Hook

### Core Function — `DeepMaybeObservable<T>` (same as hook)

Core functions use the **same** options type as the hook — `DeepMaybeObservable<Options>`.
Core wraps options with `observable(options)` at the top of the function body.
This means callers (hooks or plain JS) can pass plain objects, per-field Observables, or outer Observables without any conversion layer.

```ts
// Core — same options type as hook, wrap with observable()
interface MyHookOptions {
  maxWait?: number;
  enabled?: boolean;
}

function createMyUtil<T>(
  source$: Observable<T>,
  delay$: Observable<number>,
  options?: DeepMaybeObservable<MyHookOptions>
): { value$: Observable<T> } {
  const opts$ = observable(options); // always wrap — handles plain, per-field, or outer Observable
  // Reactive read → opts$.get().field inside createObserve()
  // Construction-time read → opts$.peek()?.field
}
```

### Hook Wrapper — `DeepMaybeObservable<T>` (passes through to core)

Define the options interface with **plain types** and wrap the parameter with `DeepMaybeObservable<T>`.
Pass `options` directly to the core function — no conversion needed.

```ts
// ❌ Bad — per-field MaybeObservable in the interface
interface UseMyHookOptions {
  enabled?: MaybeObservable<boolean>;
  rootMargin?: MaybeObservable<string>;
}

// ✅ Good — plain interface, DeepMaybeObservable on the parameter
interface UseMyHookOptions {
  enabled?: boolean;
  rootMargin?: string;
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  return useScope(() => createMyUtil(source$, options)); // options passed as-is
}
```

### ❌ Anti-pattern — Converting options before passing to core

```ts
// ❌ NEVER do this — snapshot at hook level loses reactivity
function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const rawOpts = isObservable(options) ? options.peek() : options; // snapshot in hook!
  return useScope(() => createMyUtil(source$, rawOpts)); // rawOpts is stale
}

// ✅ Pass options as scope param — toObs(p) handles reactivity
function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  return useScope((p) => {
    const p$ = toObs(p);
    return createMyUtil(source$, p$);
  }, options);
}
```

### ❌ Anti-pattern — peeking options outside `useScope`

```ts
// ❌ NEVER peek options outside the scope factory — even with peek()
const rawOpts = isObservable(options) ? options.peek() : options; // ← outside scope
const rawOpts = peek(options); // ← still outside scope, still wrong

return useScope((p) => { ... }, { ...rawOpts });

// ✅ Pass options directly into useScope — peek inside the factory if a mount-time snapshot is needed
import { peek } from "@utilities/peek";

return useScope((p, opts) => {
  const exposeControls = peek(opts)?.controls ?? false; // ← peek inside scope
  const opts$ = toObs(opts);
  ...
}, { cb, interval }, options); // options passed as-is
```

**Rule:** Never call `peek()` (or `isObservable` guard) on options _before_ `useScope`. Always pass the value through and handle it inside the factory.

### Hook Standard Pattern — `useScope` + `toObs`

For hooks where options contain reactive scalar fields (e.g. `MaybeObservable<number>`), use `useScope((p) => ...)` with `toObs(p)` to get a reactive Observable of the props. Pass `options` to the core as-is.

#### Pattern 1: MaybeObservable arg

Replaces `useLatest` and `useConstant` with the `useScope((p) => ..., { ...args })` pattern.

`toObs(p)` converts the ReactiveProps proxy to `Observable<Props>`. This `Observable` passes directly to core functions that accept `DeepMaybeObservable` — core wraps it with `observable()` internally, so prop changes propagate reactively into `createObserve()`.

```ts
// Hook type derived from core — single source of truth for params and return type
export type UseIntervalFn = typeof createIntervalFn;

export const useIntervalFn: UseIntervalFn = (cb, interval, options) => {
  return useScope(
    (p, opts) => {
      const p$ = toObs(p);
      const opts$ = toObs(opts);
      // p$ is Observable<Props> — passes directly as DeepMaybeObservable
      // core wraps it with observable(p$) → prop changes propagate reactively

      const result = createIntervalFn(
        (...args: unknown[]) => p.cb?.(...args), // p.cb: raw latest, always fresh
        p$.interval as Observable<number>,
        opts$
      );

      onMount(() => {
        if (p.immediate ?? true) result.resume();
      });

      return result;
    },
    { cb, interval },
    options
  );
};
```

#### Pattern 2: DeepMaybeObservable options

Read mount-time-only values (e.g. `controls: boolean`) inside the factory via `peek(opts)`. Pass `toObs(p)` to core — core wraps it with `observable()` internally for reactive access.

> **MANDATORY: Always `export const useX: UseX = ...`.**
> Function overload declarations (`export function useX(...)`) are **never allowed** in hook wrappers.
> Even when `controls: boolean` affects internal behavior, the hook must be typed as `typeof createX`
> and return the same type as the core function — no conditional overloads.

```ts
export type UseInterval = typeof createInterval;

export const useInterval: UseInterval = (intervalValue, options) => {
  return useScope(
    (scalars, opts) => {
      const scalars$ = toObs(scalars);
      const opts$ = toObs(opts);

      return createInterval(scalars$.interval as Observable<number>, opts$);
    },
    { interval: intervalValue }, // primitive scalar → wrap
    options // object → pass directly
  );
};
```

#### Pattern 3: Multi-params pass-through

When a hook accepts **multiple parameters**, each parameter needs its own independent ReactiveProps proxy.

Pass parameters as separate rest args rather than merging them into one object — merging breaks per-parameter proxy tracking.

##### Scope props wrapping rule — when to use `{ }` vs pass directly

| Parameter type                                                   | How to pass to `useScope`                            |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| **Object / `DeepMaybeObservable<Options>`**                      | Pass as-is: `useScope((p) => {}, options)`           |
| **Observable**                                                   | Pass as-is: `useScope((p) => {}, someObs$)`          |
| **Primitive scalar** (`number`, `string`, `boolean`, `function`) | Wrap: `useScope((p) => {}, { value: primitiveArg })` |

```ts
// ❌ Bad — merging primitives + options loses per-parameter proxy tracking
useScope(
  (p) => { const p$ = toObs(p); ... },
  { cb, interval, ...rawOpts } // ← DON'T spread primitives and options together
);

// ✅ Good — primitives wrapped, object options passed separately
useScope(
  (scalars, opts) => {
    const scalars$ = toObs(scalars);
    const opts$ = toObs(opts);
    ...
  },
  { cb, interval }, // primitive scalars → wrap in object
  options           // object/observable → pass directly
);
```

> **Rule of thumb:** Only wrap in `{ }` when you have bare primitive/function values that aren't already an object. Never spread `...rawOpts` into the same object as primitives.

```ts
// hook signature: useDebouncedHistory(source$, timing, restOpts)
// timing and restOpts are separate parameters → each needs its own proxy

// ❌ Before — merging into one object breaks timing proxy
useScope(
  (p) => {
    const obs$ = toObs(p);
    const result = createDebouncedHistory(source$, obs$.debounce as Observable<number>, {
      ...obs$.peek(),
      maxWait: obs$.maxWait,
    });
    onUnmount(() => result.dispose());
    return result;
  },
  { ...rawOpts, debounce: rawOpts?.debounce ?? 200 }
);

// ✅ After — independent proxy per parameter, each with its own toObs
useScope(
  (timing, restOpts) => {
    const timing$ = toObs(timing);
    const rest$ = toObs(restOpts);

    return createDebouncedHistory(source$, timing$.debounce as Observable<number>, {
      ...rest$.peek(),
      maxWait: timing$.maxWait as Observable<number | undefined>,
    });
  },
  timing, // timing param
  restOpts // restOpts param — separate proxy, not merged with timing
);
```

##### Nested object parameter with scalar hint

For nested object parameters, use `toObs(p, 'opaque')` to wrap the entire value as a single opaque observable.

```ts
useScope(
  (options1, options2) => {
    const obs1$ = toObs(options1);
    const obs2$ = toObs(options2, "opaque"); // { nested: { ... } } → treat as opaque

    createObserve(() => {
      const val = obs2$.get(); // raw nested object
    });
    return {};
  },
  options1,
  options2 // { nested: { deep: value } }
);
```

> **⚠️ Outer Observable — child-field mutation vs full-object replace**
>
> When `options` is `Observable<Options>`:
>
> - `options$.set({ rootMargin: "20px" })` — full replace → `opts$` recomputes → reactive ✓
> - `options$.rootMargin.set("20px")` — child-field mutation → behavior **may vary** by Legend-State version
>
> Reliable workarounds when callers mutate at child-field level:
>
> - Pass `rootMargin` as a per-field Observable: `{ rootMargin: observable("0px") }` ✓
> - Use full-object replace: `options$.set({ rootMargin: "20px" })` ✓

### FieldHint — per-field transform hints

Pass an optional `FieldTransformMap<T>` as the second argument to control how each field is resolved.

| Hint                      | Behavior                                                      | Use when                                    |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------- | --- |
| _(omitted)_ / `'default'` | no-op — Legend-State auto-derefs + registers dep at call site | reactive plain fields (default)             |
| `'opaque'`                | `get(fieldValue)` + `ObservableHint.opaque()`                 | non-element objects needing opaque wrapping |
| `'plain'`                 | `get(fieldValue)` + `ObservableHint.plain()`                  | prevent nested auto-deref                   |     |
| `(value) => R`            | custom transform function                                     | escape hatch for complex cases              |

> **Note:** Object-form hints are skipped when `options` is an outer `Observable<T>`.
> In that case, `opts$` proxies `options$` directly (preserving reference-equality tracking).
> Use per-field Observables or plain objects when per-field hints are needed.

> **`MaybeElement` fields — no hint at the `toObs` layer.**
> Pass the field through `toObs(p)` without a hint and resolve it inside
> `createObserve(() => get(p$.scrollTarget))` (import `get` from `@utilities/get`).
> A single `get()` call handles both the `toObs` proxy field and the inner
> Ref$/Observable/raw element — reactive dependency is registered and the
> element is returned directly. There is no per-field `toObs` hint for elements.

### Standard Pattern (with callback fields)

**raw prop access** (`p.onStart?.(...)`). The raw path always resolves to the latest closure with zero Legend-State interference.

```ts
interface UseMyHookOptions {
  onStart?: (pos: Position, e: PointerEvent) => void;
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  return useScope((p) => {
    const p$ = toObs(p); // no hint on onStart

    createObserve(() => {
      // ... when event fires:
      p.onStart?.(pos, e); // ✅ raw-prop access — always latest closure
    });
  }, options ?? {});
}
```

### ❌ Anti-pattern — Calling hooks inside `useScope` factory

Never call React hooks (e.g. `useXxx()`) inside the `useScope` factory.
The factory runs synchronously during render, but hooks called inside a callback violate React rules of hooks ordering guarantees when the scope is re-evaluated.

```ts
// ❌ NEVER — hook called inside useScope factory
export const useMyHook: UseMyHook = (source$, options) => {
  return useScope((p) => {
    const p$ = toObs(p);
    useOtherHook(source$, p$); // ← React hook inside scope factory — forbidden
  }, options ?? {});
};

// ✅ Call the core function directly instead
export const useMyHook: UseMyHook = (source$, options) => {
  return useScope((p) => {
    const p$ = toObs(p);
    return createOtherUtil(source$, p$); // ← core function — correct
  }, options ?? {});
};
```

---

## Rule 3 — Mount-time-only Properties (Special Cases Only)

> **Most options should be reactive.** Only read mount-time values outside the factory when changing a field after mount is **structurally impossible or meaningless**.
> Ask yourself: "If this field changes after mount, does it matter?" If yes, make it reactive.

Mount-time reads are restricted to these cases:

| Allowed case               | Example                                       | Why mount-time-only                           |
| -------------------------- | --------------------------------------------- | --------------------------------------------- |
| Scheduler type selection   | `interval: "requestAnimationFrame" \| number` | Cannot switch rAF ↔ setInterval after mount   |
| Conditional hook branching | `controls: boolean`                           | React rules-of-hooks — branch must not change |
| Observable initial seed    | `initialValue`                                | Seed is consumed once at Observable creation  |

**These must be reactive** (do NOT read at mount-time):

- Runtime-adjustable settings: `rootMargin`, `threshold`, `distance`, `offset`
- User-togglable flags: `enabled`, `immediate`
- Any field where post-mount changes should take effect

### Reading Mount-time Values

Read mount-time-only values **outside** the `useScope` factory, before it runs:

```ts
import { peek } from "@utilities/peek";

function useMyHook(
  intervalValue: MaybeObservable<number>,
  options?: DeepMaybeObservable<UseMyHookOptions>
) {
  return useScope(
    (p, opts) => {
      const exposeControls = peek(opts)?.controls ?? false; // ← peek inside scope
      const p$ = toObs(p);
      const opts$ = toObs(opts);

      if (exposeControls) {
        return createWithControls(p$.interval as Observable<number>, opts$);
      }
      return createSimple(p$.interval as Observable<number>, opts$);
    },
    { interval: intervalValue },
    options
  );
}
```

### Core Function

Core functions have no React lifecycle — parameters are naturally captured in the closure. Mount-time reads use `opts$.peek()?.field`.

---

## Rule 4 — Observable Return Fields: `$` Suffix

When a function returns an **object**, append `$` to any field that is an `Observable` type.
This applies to **both** core functions and hooks.
Callers can immediately recognize reactive values without checking `.get()` / `.peek()`.

```ts
// ❌ Bad — caller cannot distinguish whether isActive is Observable
return { isActive: isActive$, pause, resume };

// ✅ Good — $ suffix explicitly marks Observable fields
return { isActive$: isActive$, pause, resume };
```

### Internal variable name matches return field name

Observables declared with `$` internally should keep the same name when returned.

```ts
function useMyHook() {
  const count$ = useObservable(0); // internal: Observable<number>

  return {
    count$, // ✅ field name is also count$ — internal/external names match
    increment: () => count$.set((v) => v + 1),
  };
}

// call site
const { count$, increment } = useMyHook();
count$.get(); // ✅ $ suffix makes it immediately clear this is an Observable
```

### Non-Observable fields have no `$`

```ts
return {
  count$, // Observable — has $
  pause, // plain function — no $
  resume, // plain function — no $
};
```

### Core → Hook pass-through

Core functions using `onUnmount` for cleanup return only the functional result (no `dispose`).
The hook wrapper returns the result directly — no stripping needed:

```ts
// Core — uses onUnmount, no dispose in return
function createIntervalFn(fn: AnyFn, interval$: Observable<number>): Pausable {
  const isActive$ = observable(true);
  // ...
  onUnmount(() => {
    pause(); /* cleanup */
  });
  return { isActive$, pause, resume }; // no dispose
}

// Hook — type derived from core, direct pass-through via useScope
export type UseIntervalFn = typeof createIntervalFn;
export const useIntervalFn: UseIntervalFn = (fn, interval) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createIntervalFn((...args) => p.fn?.(...args), p$.interval as Observable<number>);
    },
    { fn, interval }
  );
};
```

---

## Rule 5 — Internal-only Observable State: `ReadonlyObservable<T>`

When a function **exclusively manages** an Observable internally and callers should not `.set()` it directly,
narrow the return type to `ReadonlyObservable<T>`.
Reactive reads (`.get()`, `.peek()`, `.onChange()`) are allowed, but write methods are blocked at the type level.

In the 2-layer architecture, the **core function** returns `Observable<T>` (full access internally),
and the **hook wrapper** narrows it to `ReadonlyObservable<T>` when exposing to callers.

```ts
import type { ReadonlyObservable } from "../../types";

// ❌ Bad — caller can arbitrarily modify hook-internal state via .set()
function useMyHook(): { count$: Observable<number> } {
  const count$ = useObservable(0);
  return { count$ };
  // call site: count$.set(-999) — can break hook invariants
}

// ✅ Good — exposed as read-only; only the hook has write access
function useMyHook(): { count$: ReadonlyObservable<number> } {
  const count$ = useObservable(0); // internal: Observable<number> (writable)
  return { count$ }; // external: ReadonlyObservable<number> (read-only)
  // call site: count$.get() ✅  count$.set() ← type error
}
```

### Return type decision criteria

| Scenario                                      | Core return     | Hook return                                |
| --------------------------------------------- | --------------- | ------------------------------------------ |
| Internally managed state (timer, loop, event) | `Observable<T>` | `ReadonlyObservable<T>`                    |
| Simple Observable return                      | `Observable<T>` | `Observable<T>` or `ReadonlyObservable<T>` |
| Caller is intended to write directly          | `Observable<T>` | `Observable<T>`                            |

### Core → Hook narrowing pattern

```ts
// Core — declares ReadonlyObservable in return type so hook can use typeof createX
function createMyUtil(source$: Observable<number>): { value$: ReadonlyObservable<number> } {
  const value$ = observable(source$.peek()); // internally writable Observable
  // ... observe, modify value$ internally ...
  onUnmount(() => {
    /* cleanup */
  });
  return { value$: value$ as ReadonlyObservable<number> }; // narrow at the boundary
}

// Hook — type derived from core, no separate type annotation needed
export type UseMyUtil = typeof createMyUtil;
export const useMyUtil: UseMyUtil = (source$) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createMyUtil(p$.source as Observable<number>);
    },
    { source: source$ }
  );
};
```

### Real-world examples

```ts
// useNow — only calls now$.set(new Date()) internally; caller is read-only
export type UseNow = typeof createNow;
export const useNow: UseNow = (options) => { ... };

// useElementVisibility — isVisible$ is only modified by IntersectionObserver callback
export type UseElementVisibility = typeof createElementVisibility;
export const useElementVisibility: UseElementVisibility = (...) => { ... }; // simple return allows Observable<T> too
```

> **Simple Observable return vs. object fields**
>
> - When a hook returns only a **single** Observable (`useElementVisibility`, `useMediaQuery`, etc.),
>   both `Observable<T>` and `ReadonlyObservable<T>` are acceptable — choose based on internal management.
> - When a hook returns an **object** containing Observable fields, prefer `ReadonlyObservable<T>`.

---

## Rule 6 — `Disposable` / `Pausable` / `Stoppable` / `Awaitable` Utilities

These types are shared interfaces defined in `../../types`. Functions matching these patterns must return the corresponding type so callers get a consistent API.

### `Disposable` — Core Function Cleanup

Core functions that run inside `useScope` use `onUnmount` for cleanup — no `dispose` needed in the return value. The `Disposable` interface is only required when composing core functions outside `useScope` (e.g., in another core function that needs to manage sub-function lifetimes manually).

```ts
export interface Disposable {
  dispose: () => void;
}
```

| Context                                      | Cleanup strategy                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| Core function called inside `useScope`       | `onUnmount(() => { /* cleanup */ })` — no `dispose` in return               |
| Core function composing other core functions | Inner functions use `onUnmount` (shared scope) — no manual `dispose` needed |
| Standalone core function (no scope context)  | Return `Disposable` for manual cleanup by the caller                        |

```ts
// ✅ Scope-aware core — uses onUnmount, no dispose in return
function createMyUtil(source$: Observable<T>): { result$: Observable<T> } {
  const result$ = observable<T>(source$.peek());

  createObserve(() => {
    result$.set(source$.get());
  }); // auto-registered to current scope

  onUnmount(() => {
    /* cleanup timers, etc. */
  });

  return { result$ }; // no dispose
}
```

> **Hook wrappers** using `useScope` get automatic cleanup — `onUnmount` runs when the scope is disposed.

### `Pausable` — Pause/Resume Loops

Used for functions that run repeatedly and are controlled via `pause()` / `resume()`.

```ts
export interface Pausable {
  readonly isActive$: ReadonlyObservable<boolean>;
  pause: Fn;
  resume: Fn;
}
```

| Criteria                                      | Core example                          | Hook example                |
| --------------------------------------------- | ------------------------------------- | --------------------------- |
| setInterval / rAF-based repeating loop        | `createIntervalFn()`, `createRafFn()` | `useIntervalFn`, `useRafFn` |
| Subscription where pause/resume is meaningful | —                                     | `useNow`                    |

```ts
// Core — uses onUnmount, returns Pausable (no dispose)
function createPollerFn(fn: AnyFn, interval$: Observable<number>): Pausable {
  const isActive$ = observable(false);
  const pause = () => {
    isActive$.set(false); /* clearInterval... */
  };
  const resume = () => {
    isActive$.set(true); /* setInterval... */
  };

  createObserve(() => {
    /* re-setup on interval$.get() change */
  });

  onUnmount(() => {
    pause();
  });

  return { isActive$, pause, resume }; // no dispose
}

// Hook — type derived from core
export type UsePoller = typeof createPollerFn;
export const usePoller: UsePoller = (fn, interval) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createPollerFn((...args) => p.fn?.(...args), p$.interval as Observable<number>);
    },
    { fn, interval }
  );
};
```

### `Stoppable<StartFnArgs>` — One-shot Timers

Used for hooks that execute once and are controlled via `stop()` / `start()`.
`StartFnArgs` is a generic specifying the argument types passed to `start()`.

```ts
export interface Stoppable<StartFnArgs extends any[] = any[]> {
  readonly isPending$: Observable<boolean>;
  stop: Fn;
  start: (...args: StartFnArgs) => void;
}
```

| Criteria                               | Core example  | Hook example       |
| -------------------------------------- | ------------- | ------------------ |
| setTimeout-based delayed execution     | `timeoutFn()` | `useTimeoutFn`     |
| Async operation pending state tracking | —             | custom async hooks |

```ts
function useDelayed<T extends AnyFn>(
  cb: T,
  delay: MaybeObservable<number>
): Stoppable<Parameters<T>> {
  const isPending$ = useObservable(false);
  const stop = () => { ... };
  const start = (...args: Parameters<T>) => { ... };
  return { isPending$, stop, start };
}
```

### `Awaitable<T>` — Sync/Async Parameters

Used when a parameter can be either a plain value or a `Promise`. Same pattern as VueUse.

```ts
export type Awaitable<T> = Promise<T> | T;
```

```ts
// ❌ Bad — accepts only async or only sync
function useMyHook(value: Promise<string>) { ... }

// ✅ Good — accepts both
function useMyHook(value: Awaitable<string>) { ... }

// handle internally
const resolved = value instanceof Promise ? await value : value;
```

---

## Rule 7 — Global Object Dependencies: Use `configurable.ts`

Directly accessing `window`, `document`, `navigator`, or `location` causes crashes in SSR environments.
Always use the constants and interfaces from `shared/configurable.ts`.

### Basic Pattern — Use `defaultWindow` / `defaultDocument` directly

```ts
import { defaultWindow, defaultDocument } from "../../shared/configurable";

// ❌ Bad — ReferenceError in SSR
const width = window.innerWidth;

// ✅ Good — SSR safe; defaultWindow is window on client, undefined in SSR
if (!defaultWindow) return; // SSR guard — always null-check before use
const width = defaultWindow.innerWidth;
```

`defaultWindow` / `defaultDocument` etc. only reference the real global objects in client environments,
so **use them directly** at the point of need — do not assign to intermediate variables.

```ts
// ❌ Bad — unnecessary intermediate variable
const win = defaultWindow;
win?.innerWidth;

// ✅ Good — direct reference
defaultWindow?.innerWidth;
if (!defaultWindow) return;
defaultWindow.innerWidth;
```

### Available Constants and Interfaces

| Constant           | Interface                          | Corresponding global     |
| ------------------ | ---------------------------------- | ------------------------ |
| `defaultWindow`    | `ConfigurableWindow`               | `window`                 |
| `defaultDocument`  | `ConfigurableDocument`             | `document`               |
| —                  | `ConfigurableDocumentOrShadowRoot` | `document \| ShadowRoot` |
| `defaultNavigator` | `ConfigurableNavigator`            | `navigator`              |
| `defaultLocation`  | `ConfigurableLocation`             | `location`               |

### Test/Custom Environment Support — `Configurable*` Interfaces

Hooks that need to inject a different `window`/`document` (e.g., iframe, Shadow DOM, test environments)
should mixin a `Configurable*` interface into their options.

```ts
import { ConfigurableWindow, defaultWindow } from "../../shared/configurable";

interface UseMyHookOptions extends ConfigurableWindow {
  passive?: boolean;
}

function useMyHook(options: UseMyHookOptions = {}) {
  // falls back to defaultWindow if options.window is not injected
  const { window: _window = defaultWindow, passive } = options;

  if (!_window) return; // SSR guard

  _window.addEventListener("resize", handler, { passive });
}
```

### SSR Guard Placement

#### Core Function — guard at function top level

Core functions have no React hooks, so early return is safe at the top level.
Return a no-op result with default values:

```ts
function createMediaQuery(query$: Observable<string>): { matches$: Observable<boolean> } {
  if (!defaultWindow) {
    return { matches$: observable(false) };
  }
  // ... actual implementation
}
```

#### Hook Wrapper — guard inside callbacks

Place SSR guards (`if (!defaultWindow) return`) **immediately before actual usage**.
Put them inside functions like `resume()`, `update()` where DOM access actually occurs —
not at hook top level — to avoid violating React's rules-of-hooks (no conditional hook calls).

```ts
// ✅ Good — guard inside resume() (useRafFn pattern)
const resume = () => {
  if (!defaultWindow) return; // SSR guard
  if (isActive$.peek()) return;
  isActive$.set(true);
  rafHandle.current = requestAnimationFrame(loop);
};
```

---

## Rule 8 — Computed Values in Components: Don't Store `.get()` in Plain Variables

The project uses `@usels/vite-plugin` (babel plugin). This plugin **automatically wraps JSX expressions in reactive tracking**, so calling `.get()` inline in JSX is safe and reactive — no manual `<Memo>` wrapper needed.

The real anti-pattern is storing `.get()` in a plain `const` and reusing that variable. The snapshot loses reactivity; changes to the Observable won't trigger re-renders.

### ❌ Anti-pattern — Snapshot stored in plain variable

```tsx
function MyComponent() {
  const isActive = isActive$.get(); // snapshot! won't re-render on change
  return <div>{isActive ? "active" : "inactive"}</div>;
}
```

```ts
function useMyHook() {
  const value = someObs$.get(); // snapshot in hook body — reactive updates invisible
  doSomething(value);
}
```

### ✅ Correct patterns

**Direct render in JSX — call `.get()` inline (babel auto-tracks)**

```tsx
function MyComponent() {
  return <div>{isActive$.get() ? "active" : "inactive"}</div>;
}
```

**Derived state → `useObservable`**

```tsx
function MyComponent() {
  const derived$ = useObservable(() => someObs$.get()); // reactive computed
  return <div>{derived$.get()}</div>;
}
```

**Reactive side-effect → `useObserve`**

```tsx
function MyComponent() {
  useObserve(() => {
    const value = someObs$.get(); // reactive dep registered
    doSomething(value);
  });
}
```

### Decision table

| Goal                                       | Pattern                                             |
| ------------------------------------------ | --------------------------------------------------- |
| Render reactive value in JSX               | `<div>{obs$.get()}</div>` — inline, babel tracks it |
| Derive a new Observable from existing ones | `useObservable(() => a$.get() + b$.get())`          |
| React to changes as a side-effect          | `useObserve(() => { ... obs$.get() ... })`          |
| Read once at mount (non-reactive)          | `obs$.peek()` — makes intent explicit               |

> **Key rule:** Call `.get()` inline in JSX or inside reactive contexts (`useObservable`, `useObserve`). Never store `.get()` in a plain variable and reuse it — that's a snapshot. Use `.peek()` only when a one-time mount-time read is intentional.
