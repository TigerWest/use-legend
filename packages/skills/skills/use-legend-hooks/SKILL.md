# use-legend

> Observable-native React utility hooks built on Legend-State (`@usels/core`, `@usels/web`).

## Hook Catalog

See [CATALOG.md](./CATALOG.md) for all 105 hooks grouped by package and category.

---

## Core Concepts

### Observable-First Pattern

All hook return values are `Observable<T>` or `ReadonlyObservable<T>`.

- Read with `.get()`, write with `.set()`
- In React components, `.get()` auto-subscribes (requires `observer` HoC or `useSelector` from `@legendapp/state/react`)

### Key Types

| Type | Description |
|------|-------------|
| `MaybeObservable<T>` | Accepts plain value or `Observable<T>` |
| `DeepMaybeObservable<T>` | Each field can also be an `Observable` |
| `ReadonlyObservable<T>` | Read-only, `.get()` only |
| `Disposable` | Has `dispose()` to clean up subscriptions/timers |

### Import Patterns

```tsx
// Framework-agnostic: reactivity, state, timer, observe, sync, utilities
import { useDebounced, useHistory, useIntervalFn } from "@usels/core"

// Browser API dependent: sensors, DOM events, media queries, elements
import { useMouse, useMediaQuery, useEventListener } from "@usels/web"
```

---

## Common Usage Patterns

### MaybeObservable Parameters

Hooks accept both plain values and Observables as arguments:

```tsx
useDebounced(search$, 300)      // plain delay
useDebounced(search$, delay$)   // reactive delay (updates dynamically)
```

### Pausable Hooks

`useIntervalFn`, `useRafFn`, `useCountdown` etc. return a `Pausable`:

```tsx
const { isActive$, pause, resume } = useIntervalFn(() => {
  count$.set(v => v + 1)
}, 1000)
```

### History Hooks

```tsx
const { undo, redo, canUndo$, canRedo$ } = useHistory(value$)

// Manual: only records snapshot on explicit commit()
const { commit, undo, redo } = useManualHistory(value$)
```

---

## Common Mistakes

1. **Missing `.get()`** — Never render an Observable directly; always call `.get()`
   ```tsx
   // ❌ <div>{debounced$}</div>
   // ✅ <div>{debounced$.get()}</div>
   ```

2. **Unnecessary `.get()` on input** — Don't unwrap when passing to hooks expecting `MaybeObservable`
   ```tsx
   // ❌ useDebounced(search$.get(), 300)
   // ✅ useDebounced(search$, 300)
   ```

3. **Missing `dispose()`** — When calling `createXxx` core functions outside a hook, always call `dispose()` on unmount

4. **SSR guard** — `@usels/web` hooks depend on `window`/`document`. Check `isSupported$` before use in SSR environments.
