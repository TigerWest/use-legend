---
paths:
  - "packages/core/src/**/*.ts"
  - "packages/integrations/src/**/*.ts"
---

# Library Implementation Guide

> **Scope:** This guide applies to `packages/core` and `packages/integrations` only.
> `packages/web` and `packages/native` do **not** use the 2-layer architecture — they implement hooks directly in `index.ts` without a `core.ts` layer.

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

| Rule | Description |
|------|-------------|
| **No React** | Never import `react` or `@legendapp/state/react` |
| **Observable args** | Reactive parameters use `Observable<T>` (hook converts via `useMaybeObservable`) |
| **`observe()` only** | Use `observe()` from `@legendapp/state`, not `useObserve()` |
| **Return `Disposable`** | Every core function returns `Disposable & { ... }` — all subscriptions/timers cleaned up via `dispose()` |
| **Observable results** | Output values are `Observable<T>` — no additional wrapping needed in hook |
| **Plain non-reactive opts** | Mount-time-only settings (edges, maxWait) are plain values, captured in closure |

```ts
import { type Observable, observe, observable } from "@legendapp/state";
import type { Disposable } from "../../types";

function createDebounced<T>(
  source$: Observable<T>,
  delay$: Observable<number>,
  options?: DebounceOptions         // non-reactive → plain
): Disposable & { value$: Observable<T> } {
  const value$ = observable<T>(source$.peek());

  const unsub = observe(() => {
    const val = source$.get();      // reactive dep
    const ms = delay$.get();        // reactive dep
    // debounce logic...
    value$.set(val);
  });

  return {
    value$,
    dispose: () => unsub(),
  };
}
```

### Hook Wrapper Rules

| Rule | Description |
|------|-------------|
| **`useMaybeObservable()`** | Convert `MaybeObservable<T>` / `DeepMaybeObservable<T>` → `Observable<T>` |
| **`useConstant(() => coreFn(...))`** | Call core function exactly once — stable across re-renders |
| **`useUnmount(dispose)`** | Cleanup on unmount (or `useEffect(() => dispose, [dispose])`) |
| **Preserve public API** | Return type stays the same — no breaking changes |

```ts
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { useUnmount } from "@legendapp/state/react";
import { createDebounced } from "./core";

export function useDebounced<T>(
  value: MaybeObservable<T>,
  ms: MaybeObservable<number> = 200,
  options?: DebounceOptions
): ReadonlyObservable<T> {
  const source$ = useMaybeObservable(value);
  const delay$ = useMaybeObservable(ms);

  const { value$, dispose } = useConstant(() => createDebounced(source$, delay$, options));

  useUnmount(dispose);

  return value$ as ReadonlyObservable<T>;
}
```

### Naming Convention

| Layer | Pattern | Example |
|-------|---------|---------|
| Core function | `createName()` | `createDebounced()`, `createHistory()`, `createIntervalFn()` |
| Core file | `core.ts` | in each hook directory |
| Hook | `useName()` | `useDebounced()`, `useHistory()` |
| Hook file | `index.ts` | (existing convention) |
| Observable variable | `name$` | `value$`, `source$`, `size$` |

---

## Rule 1 — Element Parameters: Use `useRef$` and `MaybeElement`

When a function accepts a DOM element, use `MaybeElement` as the parameter type.
This allows callers to pass a `Ref$` ref, a raw element, or an Observable element.
`MaybeElement` works in **both** core functions and hooks — `getElement()` / `peekElement()` are pure functions with no React dependency.

```ts
// ❌ Bad — raw HTMLElement only
function useMyHook(element: HTMLElement | null) { ... }

// ✅ Good — accepts Ref$, Observable, or raw element
import type { MaybeElement } from "../useRef$";

function useMyHook(element: MaybeElement) { ... }
```

### Resolving MaybeElement Internally

Use `getElement` / `peekElement` / `isRef$` from `useRef$`.
These are **pure functions** — usable in both core functions and hooks.

#### In a Core Function (uses `observe`)

```ts
import { getElement, peekElement } from "../useRef$";

function createElementSize(target: MaybeElement): Disposable & { size$: Observable<Size> } {
  const size$ = observable({ width: 0, height: 0 });

  const unsub = observe(() => {
    const el = getElement(target);  // reactive tracking registered
    if (!el || !(el instanceof HTMLElement)) return;
    // ResizeObserver setup...
  });

  return { size$, dispose: () => unsub() };
}
```

#### In a Hook (uses `useObserve`)

```ts
import { getElement, peekElement, isRef$ } from "../useRef$";

function useMyHook(element: MaybeElement) {
  useObserve(() => {
    // Reactive read — registers tracking dependency on Ref$ or Observable element
    const el = getElement(element);
    if (el) setup(el);
  });

  // Non-reactive read — use inside setup() callback (called from useObserve)
  const el = peekElement(element);
}
```

#### Hook Wrapper — pass MaybeElement directly to core

When wrapping a core function, pass `MaybeElement` as-is — no conversion needed:

```ts
export function useElementSize(target: MaybeElement, options?: ElementSizeOptions) {
  const { size$, dispose } = useConstant(() => createElementSize(target, options));
  useUnmount(dispose);
  return size$;
}
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

### Core Function — `Observable<T>` directly

Core functions receive reactive parameters as `Observable<T>`. Non-reactive options use plain types.
`DeepMaybeObservable` is **not** used in core — it is a hook-layer concern.

```ts
// Core — reactive args as Observable, non-reactive as plain
interface DebounceOptions { maxWait?: number; }

function createDebounced<T>(
  source$: Observable<T>,         // reactive → Observable
  delay$: Observable<number>,     // reactive → Observable
  options?: DebounceOptions       // non-reactive → plain
): Disposable & { value$: Observable<T> } { ... }
```

### Hook Wrapper — `DeepMaybeObservable<T>`

When designing a hook function, define the options interface with **plain types** and wrap the parameter with `DeepMaybeObservable<T>`.

```ts
// ❌ Bad — per-field MaybeObservable in the interface
interface UseMyHookOptions {
  enabled?: MaybeObservable<boolean>;
  rootMargin?: MaybeObservable<string>;
}
function useMyHook(options?: MaybeObservable<UseMyHookOptions>) { ... }

// ✅ Good — plain interface, DeepMaybeObservable on the parameter
interface UseMyHookOptions {
  enabled?: boolean;
  rootMargin?: string;
}
function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) { ... }
```

### ❌ Anti-pattern — One-time read outside reactive context

```ts
// ❌ NEVER do this — snapshot at mount, changes silently ignored
function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts = isObservable(options) ? options.get() : options; // snapshot!
  setup(opts?.rootMargin); // Observable changes after mount are invisible
}
```

`get()` and `.get()` outside a reactive context (`useObservable`, `useObserve`, `computed`)
produce a **one-time snapshot**. Observable changes after mount are silently ignored.

---

### Hook Standard Pattern — `useMaybeObservable(options, transform?)`

`useMaybeObservable` normalizes `DeepMaybeObservable<T>` into a stable computed
`Observable<T | undefined>`. Use it at the top of every hook that accepts `DeepMaybeObservable` options.
The resulting `Observable` is then passed to the core function via `useConstant`.

```ts
import { useMaybeObservable } from "../reactivity/useMaybeObservable";

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMaybeObservable(options);
  //
  // Outer Observable case:  get(options$) → dep registered on options$
  //                         child-field notifications propagate via parent dep
  // Per-field case:         Legend-State auto-derefs inner Observables
  //                         opts$.rootMargin.get() returns "0px", not Observable<string>
  //                         Changes to rootMargin$ ARE reflected in opts$.rootMargin

  useObserve(() => {
    const rootMargin = opts$.rootMargin.get();
    const enabled = opts$.enabled.get() ?? true;
    if (enabled) setup(rootMargin);
  });
}
```

> **⚠️ Outer Observable — child-field mutation vs full-object replace**
>
> When `options` is `Observable<Options>`:
> - `options$.set({ rootMargin: "20px" })` — full replace → `opts$` recomputes → reactive ✓
> - `options$.rootMargin.set("20px")` — child-field mutation → behavior **may vary** by Legend-State version
>
> Reliable workarounds when callers mutate at child-field level:
> - Pass `rootMargin` as a per-field Observable: `{ rootMargin: observable("0px") }` ✓
> - Use full-object replace: `options$.set({ rootMargin: "20px" })` ✓

### FieldHint — per-field transform hints

Pass an optional `FieldTransformMap<T>` as the second argument to control how each field is resolved.

| Hint | Behavior | Use when |
|------|----------|----------|
| _(omitted)_ / `'default'` | no-op — Legend-State auto-derefs + registers dep at call site | reactive plain fields (default) |
| `'element'` | `getElement(fieldValue)` (reactive) + `ObservableHint.opaque()` | `MaybeElement` fields |
| `'opaque'` | `get(fieldValue)` + `ObservableHint.opaque()` | non-element objects needing opaque wrapping |
| `'plain'` | `get(fieldValue)` + `ObservableHint.plain()` | prevent nested auto-deref |
| `'function'` | `get(fieldValue)` + `ObservableHint.function()` | callback fields |
| `(value) => R` | custom transform function | escape hatch for complex cases |

> **Note:** Object-form hints are skipped when `options` is an outer `Observable<T>`.
> In that case, `opts$` proxies `options$` directly (preserving reference-equality tracking).
> Use per-field Observables or plain objects when per-field hints are needed.

### Standard Pattern (with HTMLElement field)

Use `'element'` hint for `MaybeElement` fields.
`getElement()` in a reactive context registers dep on Ref$ mount/unmount and handles opaque wrapping automatically.

```ts
interface UseMyHookOptions {
  scrollTarget?: MaybeElement;
  rootMargin?: string;
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMaybeObservable(options, {
    scrollTarget: 'element', // resolves Ref$/Observable<Element> reactively, wraps in opaque
  });

  useObserve(() => {
    const root = opts$.scrollTarget.peek(); // OpaqueObject<HTMLElement> | null
    const rootMargin = opts$.rootMargin.get();
    setup({ root, rootMargin });
  });
}
```

> `'element'` internally calls `getElement(fieldValue)` → registers dep on Ref$'s internal Observable.
> When Ref$ mounts, `opts$` recomputes → `opts$.scrollTarget` updates → `useObserve` re-runs.

### Standard Pattern (with callback fields)

Use `'function'` hint for callback fields. Legend-State stores the function directly
(not as a child observable), so access via `opts$.peek()?.fieldName` pattern.

```ts
interface UseMyHookOptions {
  onStart?: (pos: Position, e: PointerEvent) => void;
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMaybeObservable(options, {
    onStart: 'function',
  });

  // ✅ Correct — access via opts$.peek()?.fieldName
  opts$.peek()?.onStart?.(pos, e);

  // ❌ Wrong — 'function' hint stores directly, NOT as child observable
  // opts$.onStart.peek()?.(pos, e)  ← .peek is not a function
}
```

### Passthrough Pattern (delegating to hooks with internal `useObserve`)

When delegating to a hook that already tracks options reactively inside its own `useObserve`
(e.g., `useIntersectionObserver`), normalize first with `useMaybeObservable`, then pass
the computed Observable child fields as references.

```ts
function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMaybeObservable(options, {
    scrollTarget: 'element',
  });

  // Pass computed Observable child fields — downstream useObserve tracks them
  useIntersectionObserver(element, callback, {
    rootMargin: opts$.rootMargin,
    root: opts$.scrollTarget as unknown as MaybeElement | undefined,
  });
}
```

### Hook-to-Core Bridge Pattern

When the core function needs both reactive Observable args and non-reactive plain options:

```ts
export function useHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<UseHistoryOptions<Raw, Serialized>>
): UseHistoryReturn<Raw, Serialized> {
  const opts$ = useMaybeObservable(options, {
    dump: "function",
    parse: "function",
    shouldCommit: "function",
  });

  // opts$.peek() → snapshot plain object for core (non-reactive options captured in closure)
  const result = useConstant(() => createHistory<Raw, Serialized>(source$, opts$.peek()));

  useUnmount(result.dispose);
  return result;
}
```

---

## Rule 3 — Mount-time-only Properties

Some options are intentionally captured **once at creation** and never updated reactively:

- `initialValue` — seeds the initial state of an Observable; later changes have no meaning
- `once` — lifecycle behavior determined at mount; dynamic changes do not apply retroactively
- `interval` / `controls` — determines scheduler type or hook selection; changing after mount has no effect

For these fields, omit the hint (use `'default'`) and read them with `usePeekInitial(obs$, fallback)`.
This is **intentional** and explicitly signals "read once, fixed at creation" — distinct from
the Anti-pattern in Rule 2 where `.get()` is accidentally used for fields that *should* be reactive.

### Core Function — plain value closure capture

Core functions have no React lifecycle, so `usePeekInitial` is unnecessary.
Plain values received as parameters are naturally captured in the closure at creation time:

```ts
function createHistory<T>(source$: Observable<T>, options?: HistoryOptions<T>) {
  // Plain values captured at creation — never changes
  const shouldCommitFn = options?.shouldCommit;
  const deep = options?.deep ?? false;

  const unsub = observe(() => {
    const value = source$.get();
    if (shouldCommitFn && !shouldCommitFn(value)) return;
    // ...
  });

  return { dispose: () => unsub(), /* ... */ };
}
```

### Hook Wrapper — `usePeekInitial(obs$, fallback?)`

`usePeekInitial` reads an Observable **once at first render** via `.peek()` and returns a
`useRef`-backed stable value. Re-renders always return the same captured value.

```ts
import { usePeekInitial } from "../reactivity/usePeekInitial";

// With fallback — return type is NonNullable<T>
const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);

// Without fallback — return type is T (may be undefined)
const once = usePeekInitial(opts$.once);
```

**Why `usePeekInitial` over raw `.peek()`:**

| | `opts$.field.peek()` | `usePeekInitial(opts$.field, fallback)` |
|---|---|---|
| Re-render stability | Re-evaluates every render (may see stale computed) | `useRef`-backed — always returns first-render value |
| Fallback handling | Manual `?? fallback` at every call site | Built-in — `fallback` param with `NonNullable<T>` return type |
| Intent clarity | Requires comment to distinguish from accidental `.peek()` | Function name itself declares "mount-time-only" intent |

### Standard Pattern

```ts
import { useMaybeObservable } from "../reactivity/useMaybeObservable";
import { usePeekInitial } from "../reactivity/usePeekInitial";

interface UseMyHookOptions {
  initialValue?: boolean;  // mount-time-only — fixed at mount
  once?: boolean;          // mount-time-only — fixed at mount
  rootMargin?: string;     // reactive — should update when changed
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMaybeObservable(options, {
    scrollTarget: 'element',
    // initialValue, once: omitted → 'default' → use usePeekInitial for mount-time read
    // rootMargin: omitted → 'default' → Legend-State auto-deref → reactive
  });

  // ✅ mount-time-only: usePeekInitial — stable across re-renders
  const initialValue = usePeekInitial(opts$.initialValue, false);
  const once = usePeekInitial(opts$.once, false);

  const state$ = useObservable<boolean>(initialValue);

  const { stop } = useIntersectionObserver(element, (entries) => {
    const latest = entries.at(-1);
    if (!latest) return;
    state$.set(latest.isIntersecting);
    if (once && latest.isIntersecting) stop();
  }, {
    rootMargin: opts$.rootMargin, // ✅ Observable child — downstream useObserve tracks it
  });

  return state$;
}
```

### Scheduler Selection Pattern (conditional hook call)

`usePeekInitial` is safe for conditional hook selection because the value is fixed at mount,
so the branch never changes across re-renders (satisfying React's rules-of-hooks).

```ts
const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);
const exposeControls = usePeekInitial(opts$.controls, false);

// Safe — interval never changes after mount
const isRaf = interval === "requestAnimationFrame";
const rafControls = useRafFn(update, { immediate: isRaf });
const intervalControls = useIntervalFn(update, intervalMs, { immediate: !isRaf });
const controls: Pausable = isRaf ? rafControls : intervalControls;
```

> **Mount-time-only field decision rule**
>
> | Field characteristic | Core function | Hook wrapper | Reason |
> |----------------------|---------------|--------------|--------|
> | Changes should re-trigger setup | `source$.get()` inside `observe()` | `opts$.field.get()` inside `useObserve` | Reactive dep registered |
> | Fixed at creation by design | `options?.field` (plain value) | `usePeekInitial(opts$.field, fallback)` | Captured once, never changes |
> | Creation-time seed for an Observable | `options?.field` (plain value) | `usePeekInitial(opts$.field, fallback)` | Observable ignores later changes |
> | Conditional hook selection | N/A (no hooks in core) | `usePeekInitial(opts$.field, fallback)` | Value fixed at mount — rules-of-hooks safe |

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
    count$,           // ✅ field name is also count$ — internal/external names match
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
  count$,   // Observable — has $
  pause,    // plain function — no $
  resume,   // plain function — no $
};
```

### Core → Hook pass-through

Core functions return `Disposable & { value$, isActive$, ... }`.
The hook wrapper strips `dispose` (handled by `useUnmount`) and passes the rest through:

```ts
// Core
function createIntervalFn(fn: AnyFn, interval$: Observable<number>): Disposable & Pausable {
  const isActive$ = observable(true);
  // ...
  return { isActive$, pause, resume, dispose };
}

// Hook — strip dispose, pass-through controls
function useIntervalFn(fn: AnyFn, interval: MaybeObservable<number>): Pausable {
  const interval$ = useMaybeObservable(interval);
  const result = useConstant(() => createIntervalFn(fn, interval$));
  useUnmount(result.dispose);
  const { dispose: _, ...controls } = result;
  return controls;
}
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
  return { count$ };               // external: ReadonlyObservable<number> (read-only)
  // call site: count$.get() ✅  count$.set() ← type error
}
```

### Return type decision criteria

| Scenario | Core return | Hook return |
|---|---|---|
| Internally managed state (timer, loop, event) | `Observable<T>` | `ReadonlyObservable<T>` |
| Simple Observable return | `Observable<T>` | `Observable<T>` or `ReadonlyObservable<T>` |
| Caller is intended to write directly | `Observable<T>` | `Observable<T>` |

### Core → Hook narrowing pattern

```ts
// Core — returns writable Observable (full internal access)
function createMyUtil(source$: Observable<number>): Disposable & { value$: Observable<number> } {
  const value$ = observable(source$.peek());
  // ... observe, modify value$ internally ...
  return { value$, dispose };
}

// Hook — narrows to ReadonlyObservable (external read-only)
function useMyUtil(source: MaybeObservable<number>): ReadonlyObservable<number> {
  const source$ = useMaybeObservable(source);
  const { value$, dispose } = useConstant(() => createMyUtil(source$));
  useUnmount(dispose);
  return value$ as ReadonlyObservable<number>;
}
```

### Real-world examples

```ts
// useNow — only calls now$.set(new Date()) internally; caller is read-only
export function useNow(options?: UseNowOptions<false>): ReadonlyObservable<Date>;
export function useNow(options: UseNowOptions<true>): { now: ReadonlyObservable<Date> } & Pausable;

// useElementVisibility — isVisible$ is only modified by IntersectionObserver callback
export function useElementVisibility(...): Observable<boolean>; // simple return allows Observable<T> too
```

> **Simple Observable return vs. object fields**
>
> - When a hook returns only a **single** Observable (`useElementVisibility`, `useMediaQuery`, etc.),
>   both `Observable<T>` and `ReadonlyObservable<T>` are acceptable — choose based on internal management.
> - When a hook returns an **object** containing Observable fields, prefer `ReadonlyObservable<T>`.

---

## Rule 6 — `Disposable` / `Pausable` / `Stoppable` / `Awaitable` Utilities

These types are shared interfaces defined in `../../types`. Functions matching these patterns must return the corresponding type so callers get a consistent API.

### `Disposable` — Core Function Cleanup (required)

Every core function **must** return `Disposable`. All subscriptions, timers, and observers are cleaned up via `dispose()`.

```ts
export interface Disposable {
  dispose: () => void;
}
```

| Criteria | Example |
|---|---|
| Any `observe()` subscription | `dispose: () => unsub()` |
| `setTimeout` / `setInterval` | `dispose: () => clearInterval(handle)` |
| `ResizeObserver` / `MutationObserver` | `dispose: () => observer.disconnect()` |
| Composed core functions | `dispose: () => { innerA.dispose(); innerB.dispose(); }` |

```ts
function createMyUtil(source$: Observable<T>): Disposable & { result$: Observable<T> } {
  const result$ = observable<T>(source$.peek());
  const subscriptions: (() => void)[] = [];

  subscriptions.push(
    observe(() => {
      result$.set(source$.get());
    })
  );

  return {
    result$,
    dispose: () => subscriptions.forEach((unsub) => unsub()),
  };
}
```

> **Hook wrappers** handle `dispose` via `useUnmount(result.dispose)` — callers never call `dispose()` directly.

### `Pausable` — Pause/Resume Loops

Used for functions that run repeatedly and are controlled via `pause()` / `resume()`.

```ts
export interface Pausable {
  readonly isActive$: ReadonlyObservable<boolean>;
  pause: Fn;
  resume: Fn;
}
```

| Criteria | Core example | Hook example |
|---|---|---|
| setInterval / rAF-based repeating loop | `createIntervalFn()`, `createRafFn()` | `useIntervalFn`, `useRafFn` |
| Subscription where pause/resume is meaningful | — | `useNow` |

```ts
// Core — returns Disposable & Pausable
function createPollerFn(fn: AnyFn, interval$: Observable<number>): Disposable & Pausable {
  const isActive$ = observable(false);
  const pause = () => { isActive$.set(false); /* clearInterval... */ };
  const resume = () => { isActive$.set(true); /* setInterval... */ };
  const unsub = observe(() => { /* re-setup on interval$.get() change */ });
  return { isActive$, pause, resume, dispose: () => { pause(); unsub(); } };
}

// Hook — strips dispose, returns Pausable
function usePoller(fn: AnyFn, interval: MaybeObservable<number>): Pausable {
  const interval$ = useMaybeObservable(interval);
  const result = useConstant(() => createPollerFn(fn, interval$));
  useUnmount(result.dispose);
  const { dispose: _, ...controls } = result;
  return controls;
}
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

| Criteria | Core example | Hook example |
|---|---|---|
| setTimeout-based delayed execution | `timeoutFn()` | `useTimeoutFn` |
| Async operation pending state tracking | — | custom async hooks |

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

| Constant | Interface | Corresponding global |
|---|---|---|
| `defaultWindow` | `ConfigurableWindow` | `window` |
| `defaultDocument` | `ConfigurableDocument` | `document` |
| — | `ConfigurableDocumentOrShadowRoot` | `document \| ShadowRoot` |
| `defaultNavigator` | `ConfigurableNavigator` | `navigator` |
| `defaultLocation` | `ConfigurableLocation` | `location` |

### Test/Custom Environment Support — `Configurable*` Interfaces

Hooks that need to inject a different `window`/`document` (e.g., iframe, Shadow DOM, test environments)
should mixin a `Configurable*` interface into their options.

```ts
import {
  ConfigurableWindow,
  defaultWindow,
} from "../../shared/configurable";

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
Return a no-op `Disposable` with default values:

```ts
function createMediaQuery(query$: Observable<string>): Disposable & { matches$: Observable<boolean> } {
  if (!defaultWindow) {
    return { matches$: observable(false), dispose: () => {} };
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
