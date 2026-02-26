---
paths:
  - "packages/utils/src/**/*.ts"
  - "packages/integrations/src/**/*.ts"
---

# Library Implementation Guide

## Rule 1 — Element Parameters: Use `useEl$` and `MaybeElement`

When a hook accepts a DOM element, use `MaybeElement` as the parameter type.
This allows callers to pass an `El$` ref, a raw element, or an Observable element.

```ts
// ❌ Bad — raw HTMLElement only
function useMyHook(element: HTMLElement | null) { ... }

// ✅ Good — accepts El$, Observable, or raw element
import type { MaybeElement } from "../useEl$";

function useMyHook(element: MaybeElement) { ... }
```

### Resolving MaybeElement Internally

Use `getElement` / `peekElement` / `isEl$` from `useEl$`:

```ts
import { getElement, peekElement, isEl$ } from "../useEl$";

function useMyHook(element: MaybeElement) {
  useObserve(() => {
    // Reactive read — registers tracking dependency on El$ or Observable element
    const el = getElement(element);
    if (el) setup(el);
  });

  // Non-reactive read — use inside setup() callback (called from useObserve)
  const el = peekElement(element);
}
```

### Creating El$ Refs in Components

```tsx
import { useEl$ } from "@las/utils";

function MyComponent() {
  const el$ = useEl$<HTMLDivElement>();
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

This is exactly what `useEl$` does internally:
```ts
el$.set(node ? ObservableHint.opaque(node) : null);
```

**`El$` (from `useEl$`) is the preferred way to hold reactive element references**
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

### Standard Pattern — `useMayObservableOptions(options, transform?)`

`useMayObservableOptions` normalizes `DeepMaybeObservable<T>` into a stable computed
`Observable<T | undefined>`. Use it at the top of every hook that accepts `DeepMaybeObservable` options.

```ts
import { useMayObservableOptions } from "../function/useMayObservableOptions";

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMayObservableOptions(options);
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
| _(omitted)_ / `'get'` | no-op — Legend-State auto-derefs + registers dep at call site | reactive plain fields (default) |
| `'peek'` | `peek(fieldValue)` — no dep, mount-time snapshot | fields fixed at mount (`initialValue`, `once`) |
| `'get.element'` | `getElement(fieldValue)` (reactive) + `ObservableHint.opaque()` | `MaybeElement` fields that should be reactive |
| `'peek.element'` | `peekElement(fieldValue)` (non-reactive) + `ObservableHint.opaque()` | `MaybeElement` fields fixed at mount |
| `'get.opaque'` | `get(fieldValue)` + `ObservableHint.opaque()` | non-element objects needing opaque wrapping |
| `'get.plain'` | `get(fieldValue)` + `ObservableHint.plain()` | prevent nested auto-deref |
| `'get.function'` | `get(fieldValue)` + `ObservableHint.function()` | callback fields |
| `(value) => R` | custom transform function | escape hatch for complex cases |

> **Note:** Object-form hints are skipped when `options` is an outer `Observable<T>`.
> In that case, `opts$` proxies `options$` directly (preserving reference-equality tracking).
> Use per-field Observables or plain objects when per-field hints are needed.

### Standard Pattern (with HTMLElement field)

Use `'get.element'` hint for `MaybeElement` fields.
`getElement()` in a reactive context registers dep on El$ mount/unmount and handles opaque wrapping automatically.

```ts
interface UseMyHookOptions {
  scrollTarget?: MaybeElement;
  rootMargin?: string;
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMayObservableOptions(options, {
    scrollTarget: 'get.element', // resolves El$/Observable<Element> reactively, wraps in opaque
  });

  useObserve(() => {
    const root = opts$.scrollTarget.peek(); // OpaqueObject<HTMLElement> | null
    const rootMargin = opts$.rootMargin.get();
    setup({ root, rootMargin });
  });
}
```

> `'get.element'` internally calls `getElement(fieldValue)` → registers dep on El$'s internal Observable.
> When El$ mounts, `opts$` recomputes → `opts$.scrollTarget` updates → `useObserve` re-runs.

### Passthrough Pattern (delegating to hooks with internal `useObserve`)

When delegating to a hook that already tracks options reactively inside its own `useObserve`
(e.g., `useIntersectionObserver`), normalize first with `useMayObservableOptions`, then pass
the computed Observable child fields as references.

```ts
function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMayObservableOptions(options, {
    scrollTarget: 'get.element',
  });

  // Pass computed Observable child fields — downstream useObserve tracks them
  useIntersectionObserver(element, callback, {
    rootMargin: opts$.rootMargin,
    root: opts$.scrollTarget as unknown as MaybeElement | undefined,
  });
}
```

---

## Rule 3 — Mount-time-only Properties: Use `peek`

Some options are intentionally captured **once at mount** and never updated reactively:

- `initialValue` — seeds the initial state of an Observable; later changes have no meaning
- `once` — lifecycle behavior determined at mount; dynamic changes do not apply retroactively

For these fields, use `peek()` from `@las/utils` — the non-reactive counterpart to `get()`.
This is **intentional** and explicitly signals "read once, fixed at mount" — distinct from
the Anti-pattern in Rule 2 where `get()` is accidentally used for fields that *should* be reactive.

```ts
import { useMayObservableOptions } from "../function/useMayObservableOptions";

interface UseMyHookOptions {
  initialValue?: boolean;  // mount-time-only — fixed at mount
  once?: boolean;          // mount-time-only — fixed at mount
  rootMargin?: string;     // reactive — should update when changed
}

function useMyHook(options?: DeepMaybeObservable<UseMyHookOptions>) {
  const opts$ = useMayObservableOptions(options, {
    initialValue: 'peek', // ✅ mount-time-only — no dep registered
    once: 'peek',         // ✅ mount-time-only — no dep registered
    // rootMargin: omitted → default 'get' → Legend-State auto-deref → reactive
  });

  // opts$.initialValue.peek() / opts$.once.peek() — no dep, intentional one-time read
  const state$ = useObservable<boolean>(opts$.initialValue.peek() ?? false);
  const once = opts$.once.peek() ?? false;

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

> **`'peek'` hint vs omitted (default `'get'`) decision rule**
>
> | Field characteristic | FieldHint | Reason |
> |----------------------|-----------|--------|
> | Changes should re-trigger setup | _(omitted)_ — `'get'` | Legend-State auto-deref registers dep at call site |
> | Fixed at mount by design | `'peek'` | mount-time snapshot, no dep — explicit and intentional |
> | Mount-time seed for an Observable | `'peek'` | Observable ignores later changes anyway; `peek` makes intent clear |
