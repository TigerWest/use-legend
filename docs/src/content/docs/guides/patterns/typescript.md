---
title: TypeScript
description: Observable typing, store type inference, and DeepMaybeObservable patterns.
---

TypeScript patterns specific to this library. All examples assume `strict: true`.

## Observable Type Inference

`useObservable<T>(initial)` infers `Observable<T>` from the initial value:

```tsx
import { useObservable } from "@legendapp/state/react";

function Example() {
  const count$ = useObservable(0);                 // Observable<number>
  const name$ = useObservable<string | null>(null); // Observable<string | null>
}
```

Optional nested properties surface as `T | undefined` at each level:

```tsx
const user$ = useObservable<{ profile?: { name: string } }>({});
return <p>{user$.profile.name.get() ?? "unknown"}</p>;
```

## Store Type Inference

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

## `DeepMaybeObservable<T>` — Hook Option Types

Define option interfaces with **plain types**. Wrap the parameter with `DeepMaybeObservable<T>` so callers can pass plain objects, per-field observables, or an outer observable:

```tsx
import type { DeepMaybeObservable } from "@usels/core";

// ❌ Bad — per-field MaybeObservable in the interface
interface Options {
  enabled?: MaybeObservable<boolean>;
}

// ✅ Good — plain interface, DeepMaybeObservable on the parameter
interface Options {
  enabled?: boolean;
}

function useMyHook(options?: DeepMaybeObservable<Options>) { ... }
```

## `Observable<T>` vs `T` Boundaries

When passing observables to external code, resolve at the boundary:

```tsx
import type { Observable } from "@usels/core";

// Plain function — pass .get() snapshot
function formatPrice(price: number): string { ... }
formatPrice(price$.get());

// Reactive function — accept Observable<T>
function syncToServer(data$: Observable<Profile>) {
  observe(() => {
    sendUpdate(data$.get());
  });
}
syncToServer(profile$);
```

## `ReadonlyObservable<T>` — Narrowing Internal State

When a hook manages state internally and callers should not `.set()` it, narrow to `ReadonlyObservable<T>`:

```tsx
import type { ReadonlyObservable } from "@usels/core";

function useTimer(): { elapsed$: ReadonlyObservable<number> } {
  const elapsed$ = observable(0);
  // ... internal updates only
  return { elapsed$ };
  // caller: elapsed$.get() ✅  elapsed$.set() ← type error
}
```

## Related

- [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/) — how `.get()` works in JSX and common pitfalls.
