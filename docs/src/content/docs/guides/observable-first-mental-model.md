---
title: Observable-First Mental Model
description: Understand how use-legend moves changing values into observables and updates only the UI reads that depend on them.
---

`use-legend` keeps React responsible for the component tree and uses
Legend-State observables for values that change over time.

Instead of making a component render the default update unit, you read
observables where the UI needs the value. The reactive boundary around that read
updates when the observable changes.

## From React State To Observable State

With `useState` or `useReducer`, changing one value schedules a render for the
component that owns it.

With an observable, the changing value lives outside the render cycle:

```tsx
import { useObservable } from "@legendapp/state/react";

function Counter() {
  const count$ = useObservable(0);

  count$.get(); // read
  count$.set((count) => count + 1); // write

  return <span>{count$.get()}</span>;
}
```

Use `$` for observable variables. The suffix makes reactive values visible in
regular TypeScript code and lets the ESLint plugin catch common mistakes.

## Derived Observables

Derived values are observables too. Pass a compute function to `useObservable`:

```tsx
function Doubler() {
  const count$ = useObservable(0);
  const double$ = useObservable(() => count$.get() * 2);

  return <span>{double$.get()}</span>;
}
```

`double$` tracks the `count$` read inside the function. When `count$` changes,
`double$` has the new value without introducing component state.

## Read At The Leaf

Read as close as possible to the UI value that needs to update:

```tsx
<span>{user$.profile.name.get()}</span>
```

Avoid taking a broad snapshot and then reading from the plain value:

```tsx
const user = user$.get();

return <span>{user.profile.name}</span>;
```

That snapshot widens the subscription and can miss later updates if it happens
outside a reactive boundary.

## Next

- Read [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/)
  to understand how the Babel plugin turns `.get()` into a fine-grained leaf.
- Read [Rendering Boundaries](/use-legend/guides/concepts/rendering-boundaries/)
  to understand `Memo`, `For`, and the transform.
- See [Utility Hooks](/use-legend/guides/patterns/utility-hooks/) for the
  observable-first hook catalog.
