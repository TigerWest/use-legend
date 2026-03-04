---
paths:
  - "packages/core/src/**/*.ts"
  - "packages/integrations/src/**/*.ts"
---

# Library Implementation Guide

## Rule 1 — Element Parameters: Use `useRef$` and `MaybeElement`

When a hook accepts a DOM element, use `MaybeElement` as the parameter type.
This allows callers to pass an `Ref$` ref, a raw element, or an Observable element.

```ts
// ❌ Bad — raw HTMLElement only
function useMyHook(element: HTMLElement | null) { ... }

// ✅ Good — accepts Ref$, Observable, or raw element
import type { MaybeElement } from "../useRef$";

function useMyHook(element: MaybeElement) { ... }
```

### Resolving MaybeElement Internally

Use `getElement` / `peekElement` / `isRef$` from `useRef$`:

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

## Rule 2 — Options Parameters: Use `DeepMaybeObservable`

When designing a useHook function, define the options interface with **plain types** and wrap the parameter with `DeepMaybeObservable<T>`.

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

### Standard Pattern — `useMaybeObservable(options, transform?)`

`useMaybeObservable` normalizes `DeepMaybeObservable<T>` into a stable computed
`Observable<T | undefined>`. Use it at the top of every hook that accepts `DeepMaybeObservable` options.

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

---

## Rule 3 — Mount-time-only Properties: Use `usePeekInitial`

Some options are intentionally captured **once at mount** and never updated reactively:

- `initialValue` — seeds the initial state of an Observable; later changes have no meaning
- `once` — lifecycle behavior determined at mount; dynamic changes do not apply retroactively
- `interval` / `controls` — determines scheduler type or hook selection; changing after mount has no effect

For these fields, omit the hint (use `'default'`) and read them with `usePeekInitial(obs$, fallback)`.
This is **intentional** and explicitly signals "read once, fixed at mount" — distinct from
the Anti-pattern in Rule 2 where `.get()` is accidentally used for fields that *should* be reactive.

### `usePeekInitial(obs$, fallback?)` — mount-time Observable read

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
> | Field characteristic | Access pattern | Reason |
> |----------------------|----------------|--------|
> | Changes should re-trigger setup | `opts$.field.get()` inside `useObserve` | Legend-State auto-deref registers dep at call site |
> | Fixed at mount by design | `usePeekInitial(opts$.field, fallback)` | `useRef`-backed mount-time snapshot — stable and intentional |
> | Mount-time seed for an Observable | `usePeekInitial(opts$.field, fallback)` | Observable ignores later changes; `usePeekInitial` makes intent clear |
> | Conditional hook selection | `usePeekInitial(opts$.field, fallback)` | Value fixed at mount — React rules-of-hooks safe |

---

## Rule 4 — Observable Return Fields: `$` Suffix

When a hook returns an **object**, append `$` to any field that is an `Observable` type.
This lets callers immediately recognize reactive values without checking `.get()` / `.peek()`.

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

---

## Rule 5 — Internal-only Observable State: `ReadonlyObservable<T>`

When a hook **exclusively manages** an Observable internally and callers should not `.set()` it directly,
narrow the return type to `ReadonlyObservable<T>`.
Reactive reads (`.get()`, `.peek()`, `.onChange()`) are allowed, but write methods are blocked at the type level.

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

| Scenario | Return type |
|---|---|
| Hook exclusively manages state (timer, loop, event, etc.) | `ReadonlyObservable<T>` |
| Simple Observable return (the hook itself is that Observable) | `Observable<T>` |
| Caller is intended to write directly | `Observable<T>` |

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

## Rule 6 — `Pausable` / `Stoppable` / `Awaitable` Utilities

These three types are shared interfaces defined in `../../types`. Hooks matching these patterns must return the corresponding type so callers get a consistent API.

### `Pausable` — Pause/Resume Loops

Used for hooks that run repeatedly and are controlled via `pause()` / `resume()`.

```ts
export interface Pausable {
  readonly isActive$: ReadonlyObservable<boolean>;
  pause: Fn;
  resume: Fn;
}
```

| Criteria | Example hooks |
|---|---|
| setInterval / rAF-based repeating loop | `useIntervalFn`, `useRafFn` |
| Subscription where pause/resume is meaningful | `useNow` |

```ts
function useMyPoller(fn: AnyFn, interval: number): Pausable {
  const isActive$ = useObservable(false);
  const pause = () => { ... };
  const resume = () => { ... };
  return { isActive$, pause, resume };
}

// call site
const { isActive$, pause, resume } = useMyPoller(fetchData, 5000);
isActive$.get(); // boolean — check if currently running
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

| Criteria | Example hooks |
|---|---|
| setTimeout-based delayed execution | `useTimeoutFn` |
| Async operation pending state tracking | custom async hooks |

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
