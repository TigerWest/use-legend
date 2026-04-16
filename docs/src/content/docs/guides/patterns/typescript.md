---
title: TypeScript
description: Typing observables, typing store setups, typing props through useMaybeObservable, and common hook type pitfalls.
---

Patterns that come up when using this library at team scale. All examples assume `strict: true` in `tsconfig.json`.

## Typing Observables

`useObservable<T>(initial)` infers `Observable<T>` from the initial value:

```tsx
import { useObservable } from "@legendapp/state/react";

function Example() {
  const count$ = useObservable(0);                 // Observable<number>
  const name$ = useObservable<string | null>(null); // Observable<string | null>
}
```

When a property might be absent, the type surfaces as `DeepMaybeObservable<T>` — a union of `Observable<T>` and `undefined` at each level. Use `?.` inside `.get()` paths when navigating optional properties:

```tsx
function Profile() {
  const user$ = useObservable<{ profile?: { name: string } }>({});

  const name = user$.profile.name.get(); // string | undefined
  return <p>{name ?? "unknown"}</p>;
}
```

## Generic Store Setup

`createStore` infers its return shape from the setup function. Type the setup inputs, not the return value:

```tsx
import { createStore, observable } from "@usels/core";

type Product = { id: string; price: number };

const [useProductStore, getProductStore] = createStore("products", () => {
  const cart$ = observable<Record<string, number>>({});
  const products$ = observable<Product[]>([]);

  const addToCart = (id: string, quantity = 1) => {
    cart$.set((cart) => ({ ...cart, [id]: (cart[id] ?? 0) + quantity }));
  };

  return { cart$, products$, addToCart };
});

// useProductStore(): { cart$: Observable<Record<string, number>>,
//                      products$: Observable<Product[]>,
//                      addToCart: (id: string, quantity?: number) => void }
```

Keep each field's explicit generic at the `observable<T>()` call; the store return type follows.

## Typing Props with `useMaybeObservable`

`useMaybeObservable(props)` normalizes a plain props object into an `Observable<Props | undefined>`. Inside the component, `.get()` paths return the plain types:

```tsx
import { useMaybeObservable } from "@usels/core";
import { useObservable, useObserve } from "@legendapp/state/react";

type EditableTitleProps = {
  value: string;
  onCommit: (value: string) => void;
};

function EditableTitle(props: EditableTitleProps) {
  const props$ = useMaybeObservable(props);
  // props$: Observable<EditableTitleProps | undefined>
  // props$.value.get(): string
  // props$.onCommit.get(): (value: string) => void

  const draft$ = useObservable(props.value);

  useObserve(() => {
    draft$.set(props$.value.get());
  });

  return <input value={draft$.get()} onChange={(event) => draft$.set(event.currentTarget.value)} />;
}
```

`useMaybeObservable` accepts plain values, per-field observables, or an outer observable — all normalize into the same `DeepMaybeObservable` shape. This lets parents pass either plain props or reactive props without the component needing to know.

## Common TypeScript Pitfalls

**Destructuring an observable loses reactivity.** The plain value is a snapshot, not an observable:

```tsx
// ❌ Destructuring strips Observable wrapper
const { value } = user$.get();
return <span>{value}</span>; // plain string, won't react

// ✅ Keep the observable chain
return <span>{user$.value.get()}</span>;
```

**Passing `Observable<T>` to a function expecting `T`.** If a helper expects a plain `T`, call `.get()` at the boundary. If a helper expects reactive updates, accept `Observable<T>`:

```tsx
import { useObservable, useObserve } from "@legendapp/state/react";
import type { Observable } from "@usels/core";

function logOnce(value: string) { console.log(value); }
function logReactive(value$: Observable<string>) {
  useObserve(() => console.log(value$.get()));
}

function Logger() {
  const name$ = useObservable("alice");

  logOnce(name$.get());  // snapshot at call time
  logReactive(name$);    // reactive every change
}
```

**Storing `.get()` in a plain variable defeats auto-tracking.** The Babel plugin tracks `.get()` calls inline in JSX; a snapshot stored in a `const` is just a value at render time.

```tsx
// ❌ Snapshot — won't update
const count = count$.get();
return <span>Count: {count}</span>;

// ✅ Inline — plugin wraps as a fine-grained leaf
return <span>Count: {count$.get()}</span>;
```

See [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/) for the full story.

## Related

- [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/) — the plugin behavior that makes `.get()` work in JSX.
- [Utility Hooks](/use-legend/guides/patterns/utility-hooks/) — the hook catalog.
