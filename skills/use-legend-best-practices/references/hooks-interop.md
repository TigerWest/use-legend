# Using Library Functions in Scope

## Core Rule

In `"use scope"` components, call **core functions** (`createDebounced`, `createElementSize`, etc.), NOT hooks (`useDebounced`, `useElementSize`). Hooks are React hooks and are **banned** inside scope. There is no compile-time or runtime error -- reactivity silently breaks.

| Context | Use |
|---------|-----|
| Regular component (no scope) | `useDebounced`, `useElementSize`, `useObservable`, ... |
| `"use scope"` component | `createDebounced`, `createElementSize`, `observable`, ... |

## Hook to Core Function Mapping

| Hook (non-scope) | Core function (scope) |
|---|---|
| `useDebounced(source$, ms)` | `createDebounced(source$, ms)` |
| `useElementSize(el$)` | `createElementSize(el$)` |
| `useIntervalFn(fn, ms)` | `createIntervalFn(fn, ms)` |
| `useObservable(init)` | `observable(init)` |
| `useRef$()` | `createRef$()` |
| `useObserve(fn)` | `observe(fn)` |

Pattern: `useX` becomes `createX` or the underlying primitive (`observable`, `observe`).

## Core Functions Return Observables

Core functions return `Observable` or `ReadonlyObservable` values. Read them with `.get()` inline in JSX for reactive tracking.

```tsx
function Panel() {
  "use scope";
  const el$ = createRef$<HTMLDivElement>();
  const { width$, height$ } = createElementSize(el$);

  // width$ and height$ are ReadonlyObservable<number>
  return <div ref={el$}>{width$.get()} x {height$.get()}</div>;
}
```

## `MaybeObservable<T>` Parameters

Core functions accept `MaybeObservable<T>` -- both observable and plain values. Pass whichever you have; no conversion needed.

```tsx
"use scope";
const delay$ = observable(300);

// observable -- fine
const debounced1$ = createDebounced(source$, delay$);

// plain number -- also fine
const debounced2$ = createDebounced(source$, 300);
```

## Callbacks

Define callbacks as plain functions in scope. Pass them directly to core functions -- no special wrapping needed.

```tsx
"use scope";
const log = () => console.log("tick");

const { pause, resume } = createIntervalFn(log, 1000);
```

## Return Type Patterns

### `Pausable` -- for repeating loops (intervals, rAF)

```ts
{
  isActive$: ReadonlyObservable<boolean>;
  pause: () => void;
  resume: () => void;
}
```

### `Stoppable` -- for one-shot timers

```ts
{
  isPending$: Observable<boolean>;
  stop: () => void;
  start: (...args) => void;
}
```

## Full Example -- ResizablePanel

```tsx
import { observable, createRef$ } from "@usels/core";
import { createElementSize } from "@usels/web";

function ResizablePanel() {
  "use scope";
  const el$ = createRef$<HTMLDivElement>();
  const { width$, height$ } = createElementSize(el$);

  return (
    <div ref={el$}>
      {width$.get()} x {height$.get()}
    </div>
  );
}
```

## Anti-pattern: Calling a Hook Inside Scope

```tsx
// ❌ useElementSize is a React hook -- banned in scope
function BadPanel() {
  "use scope";
  const el$ = createRef$<HTMLDivElement>();
  const { width$, height$ } = useElementSize(el$);  // <- silent breakage
}

// ✅ createElementSize is a core function -- correct in scope
function GoodPanel() {
  "use scope";
  const el$ = createRef$<HTMLDivElement>();
  const { width$, height$ } = createElementSize(el$);
}
```
