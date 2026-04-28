# Derived State & Effects

## Derived Values

When you need a value computed from one or more observables, create a **derived observable** rather than using an effect that mirrors state.

### Hook Context (component body)

```tsx
function Component() {
  const firstName$ = useObservable("John");
  const lastName$ = useObservable("Doe");

  // Derived observable -- recomputes when either source changes
  const fullName$ = useObservable(() => `${firstName$.get()} ${lastName$.get()}`);

  return <span>{fullName$.get()}</span>;
}
```

### Scope Context ("use scope")

```tsx
import { observable } from "@legendapp/state";

function Component() {
  "use scope";
  const firstName$ = observable("John");
  const lastName$ = observable("Doe");

  const fullName$ = observable(() => `${firstName$.get()} ${lastName$.get()}`);

  return <span>{fullName$.get()}</span>;
}
```

### Anti-pattern: Mirroring with Effects

```tsx
// ❌ BAD -- effect that copies derived state into another observable
const fullName$ = observable("");
createObserve(() => {
  fullName$.set(`${firstName$.get()} ${lastName$.get()}`);
});

// ✅ GOOD -- computed observable, no effect needed
const fullName$ = observable(() => `${firstName$.get()} ${lastName$.get()}`);
```

## Effects

Use effects for **side-effects** (DOM manipulation, API calls, analytics, logging), not for deriving state.

### Three Effect Primitives

| Primitive | When it fires | Use case |
|-----------|--------------|----------|
| `createObserve()` / `useObserve()` | Any tracked observable changes | General-purpose side-effects |
| `watch()` / `useWatch()` | Specific source changes, with old/new values | Reacting to a single source with comparison |
| `whenever()` / `useWhenever()` | Source transitions to truthy | One-time or gated side-effects |

### Hook Context

```tsx
function Component() {
  const count$ = useObservable(0);

  // Runs whenever count$ changes
  useObserve(() => {
    console.log("Count changed:", count$.get());
  });

  // Runs with old/new value comparison
  useWatch(count$, (value, prev) => {
    if (value > 10) sendAlert("High count");
  });

  // Runs once when count$ becomes truthy
  useWhenever(count$, (value) => {
    trackFirstInteraction();
  }, { once: true });
}
```

### Scope Context ("use scope")

Inside `"use scope"`, use the **non-hook** versions. These are auto-cleaned up when the scope unmounts.

```tsx
import { observable } from "@legendapp/state";
import { createObserve, watch, whenever } from "@usels/core";

function Component() {
  "use scope";
  const count$ = observable(0);

  // observe -- general side-effect
  createObserve(() => {
    console.log("Count changed:", count$.get());
  });

  // watch -- with old/new comparison
  watch(count$, (value, prev) => {
    if (value > 10) sendAlert("High count");
  });

  // whenever -- fires on truthy transition
  whenever(count$, (value) => {
    trackFirstInteraction();
  }, { once: true });
}
```

## Choosing Between Derived and Effect

| Need | Use |
|------|-----|
| Compute a new value from observables | Derived observable: `observable(() => ...)` |
| React to changes with a side-effect | `createObserve()` / `useObserve()` |
| Compare old/new values on change | `watch()` / `useWatch()` |
| Fire once when condition becomes true | `whenever()` / `useWhenever()` with `{ once: true }` |
| Fire every time condition becomes true | `whenever()` / `useWhenever()` |

## Anti-pattern: `.get()` in Effect Then Early Return

```tsx
// ❌ BAD -- early return prevents tracking of later observables
createObserve(() => {
  if (loading$.get()) return;
  processData(data$.get());  // never tracked if loading$ is true initially
});

// ✅ GOOD -- read all sources first, then branch
createObserve(() => {
  const loading = loading$.get();
  const data = data$.get();
  if (loading) return;
  processData(data);
});
```
