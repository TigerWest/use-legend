# Reading Observable Values

## Decision Table

| Goal | Pattern |
|------|---------|
| Render reactive value in JSX | `<span>{obs$.get()}</span>` -- inline, vite plugin auto-tracks |
| Derive new observable | `const derived$ = observable(() => a$.get() + b$.get())` |
| Reactive side-effect | `observe(() => { const v = obs$.get(); doSomething(v); })` |
| Read once at mount (non-reactive) | `obs$.peek()` -- intent is explicit |
| Normalize `DeepMaybeObservable` field | `get(props).field` / `peek(props).field` |

## `get()` / `peek()` Function Forms

`get()` and `peek()` are utilities from `@usels/core` that normalize `DeepMaybeObservable<T>`. A `DeepMaybeObservable<T>` value can be a plain object, an object with per-field observables, or a single outer `Observable<T>`. These functions handle all three uniformly:

- **`get(value)`** -- reactive read. Calls `.get()` on any observable it encounters, registering tracking dependencies.
- **`peek(value)`** -- non-reactive read. Calls `.peek()` on any observable, reading without registering dependencies.

```ts
import { get, peek } from "@usels/core";

// All three shapes resolve the same way:
get(plainObj).field;              // plain object -- returned as-is
get(perFieldObsObj).field;        // per-field observables -- each .get()'d
get(outerObs$).field;             // outer Observable<T> -- .get()'d then field access

peek(props).field;                // same shapes, but non-reactive
```

Use `get()` inside reactive contexts (`observe`, computed `observable`). Use `peek()` everywhere else.

## Anti-pattern 1: Snapshot in Variable

Storing `.get()` in a `const` creates a dead snapshot. The vite plugin cannot track a plain variable -- it only auto-tracks `.get()` calls that appear inline in JSX.

```tsx
// ❌ snapshot -- loses reactivity, never re-renders
function MyComponent() {
  "use scope";
  const active = isActive$.get();  // plain value, dead
  return <div>{active ? "on" : "off"}</div>;
}

// ✅ inline -- vite plugin auto-tracks
function MyComponent() {
  "use scope";
  return <div>{isActive$.get() ? "on" : "off"}</div>;
}
```

## Anti-pattern 2: Early Return with `.get()`

An early-return branch that calls `.get()` prevents the component from tracking observables in later branches. When the early-return condition changes, the component will not re-render.

```tsx
// ❌ early return -- component won't re-render when error changes
function MyComponent() {
  "use scope";
  if (error$.get()) return <p>Error</p>;
  return <p>{data$.get()}</p>;
}

// ✅ use <Show> for conditional rendering
import { Show } from "@legendapp/state/react";

function MyComponent() {
  "use scope";
  return (
    <>
      <Show if={error$}><p>Error: {error$.get()?.message}</p></Show>
      <Show if={data$}><p>{data$.get()}</p></Show>
    </>
  );
}
```

## Anti-pattern 3: `.get()` in Event Handler

`.get()` inside an imperative handler (click, submit, etc.) needlessly registers a tracking dependency in the wrong context. Handlers are not reactive contexts -- tracking has no effect and signals incorrect intent.

```tsx
// ❌ .get() in click handler -- needlessly registers tracking in wrong context
const handleClick = () => {
  const val = count$.get();
  sendAnalytics(val);
};

// ✅ .peek() in handler -- non-reactive, correct for imperative code
const handleClick = () => {
  const val = count$.peek();
  sendAnalytics(val);
};
```

## Summary Rule

Call `.get()` ONLY in two places:

1. **Inline in JSX** -- the vite plugin auto-tracks these calls.
2. **Inside reactive contexts** -- `observe(() => ...)`, `observable(() => ...)`.

Everywhere else, use `.peek()`.
