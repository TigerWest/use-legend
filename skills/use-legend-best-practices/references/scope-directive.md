# The "use scope" Directive

## What It Does

`"use scope"` is a string directive placed at the top of a React component function body. The Vite/Babel plugin (`@usels/vite-plugin`) transforms it into a `useScope()` call at compile time.

The scope factory runs **exactly once** at component mount. It is stable across re-renders -- state changes do NOT re-execute the factory body. All observables, effects, and lifecycle callbacks declared inside the scope persist for the component's lifetime and are automatically cleaned up on unmount.

```tsx
function MyComponent() {
  "use scope";  // <-- transformed to useScope() by the plugin
  // Everything below runs ONCE at mount, never again on re-render
}
```

## Allowed APIs Inside Scope

| API | Import | Purpose |
|-----|--------|---------|
| `observable(value)` | `@usels/core` | Create observable state |
| `createRef$<T>()` | `@usels/core` | Create observable element ref (opaque-wrapped) |
| `observe(fn)` | `@usels/core` | Reactive effect, auto-registered to scope, auto-cleanup |
| `onMount(fn)` | `@usels/core` | After mount (return cleanup fn for setup+cleanup pairs) |
| `onUnmount(fn)` | `@usels/core` | Unmount-only cleanup |
| `onBeforeMount(fn)` | `@usels/core` | Before paint (`useLayoutEffect` timing) |
| `toObs(props)` | `@usels/core` | Convert props to reactive Observable |
| `createDebounced()`, `createElementSize()`, `createIntervalFn()`, etc. | `@usels/core` / `@usels/web` | Core `create*` functions (scope-aware) |
| Plain functions and variables | -- | Event handlers, constants, derived values |

---

> **CRITICAL: Banned APIs Inside `"use scope"`**
>
> **ALL React hooks are forbidden** inside a `"use scope"` block:
>
> - `useState`, `useEffect`, `useMemo`, `useRef`, `useCallback`, `useReducer`
> - `useObservable`, `useRef$`, `useObserve`, `useSelector`
> - **ANY function starting with `use`** (React hook convention)
>
> There is **no compile-time error**. There is **no runtime error**. The component **appears to work** but reactivity is silently corrupted. React Strict Mode may surface the issue, but regular mode will not. This is the single most dangerous mistake when using `"use scope"`.

---

## Lifecycle Mapping

| React hook | Scope equivalent |
|------------|------------------|
| `useEffect(fn, [])` | `onMount(fn)` |
| `useEffect(() => { setup; return cleanup }, [])` | `onMount(() => { setup; return cleanup })` |
| `useLayoutEffect(fn, [])` | `onBeforeMount(fn)` |
| cleanup-only | `onUnmount(fn)` |
| `useObserve(fn)` | `observe(fn)` |
| `useObservable(init)` | `observable(init)` |
| `useRef$()` | `createRef$()` |

## Handlers and `.set()`

Event handlers defined inside the scope block CAN call `.set()` on observables. This is correct and expected -- handlers capture the stable observable reference from the scope closure and mutate it on user interaction.

```tsx
function Counter() {
  "use scope";
  const count$ = observable(0);
  const increment = () => count$.set(c => c + 1);  // correct
  return <button onClick={increment}>{count$.get()}</button>;
}
```

## Full Example

```tsx
import { observable, createRef$, observe, onMount, onUnmount } from "@usels/core";

function MyComponent() {
  "use scope";

  const count$ = observable(0);
  const el$ = createRef$<HTMLDivElement>();

  observe(() => {
    const el = el$.get();
    if (el) { /* reactive to element mount/unmount */ }
  });

  onMount(() => {
    const sub = someSubscription();
    return () => sub.unsubscribe();  // cleanup returned from onMount
  });

  const increment = () => count$.set(c => c + 1);

  return (
    <div ref={el$}>
      <span>{count$.get()}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

## Anti-pattern: React Hooks Inside Scope

```tsx
// --------- WRONG ---------
function BadComponent() {
  "use scope";
  const [count, setCount] = useState(0);   // silent breakage
  const ref = useRef(null);                // silent breakage
  const obs$ = useObservable(0);           // silent breakage
  const el$ = useRef$<HTMLDivElement>();    // silent breakage
  useEffect(() => { /* ... */ }, []);      // silent breakage
}

// --------- CORRECT ---------
function GoodComponent() {
  "use scope";
  const count$ = observable(0);
  const el$ = createRef$<HTMLDivElement>();
  observe(() => { /* reactive effect */ });
  onMount(() => { /* post-mount setup */ });
  onUnmount(() => { /* cleanup */ });
}
```

## Quick Decision Table

| Goal | Inside `"use scope"` |
|------|---------------------|
| Create state | `observable(value)` |
| Element ref | `createRef$<T>()` |
| Reactive effect | `observe(fn)` |
| Post-mount setup | `onMount(fn)` |
| Pre-paint setup | `onBeforeMount(fn)` |
| Cleanup on unmount | `onUnmount(fn)` or return cleanup from `onMount` |
| Reactive props | `toObs(props)` |
| Event handler | Plain function calling `.set()` |
