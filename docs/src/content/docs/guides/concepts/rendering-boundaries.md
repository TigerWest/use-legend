---
title: Rendering Boundaries
description: Use Memo, For, and the transform to keep observable reads fine-grained.
---

Observable state only helps rendering if reads happen inside a reactive boundary.
`use-legend` gives you explicit boundaries and a transform that can create common
boundaries automatically.

See [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/) for how JSX-positioned `.get()` reads become reactive leaves.

## Memo

`Memo` tracks observable reads inside its function child:

```tsx
import { Memo } from "@usels/core";

<Memo>{() => count$.get()}</Memo>;
```

With the Vite or Babel plugin, simple JSX reads are wrapped for you:

```tsx
<span>{count$.get()}</span>
```

The transform emits a `Memo` boundary for that read so the parent component does
not become the default update unit.

## Coarsen A Boundary Manually

AutoWrap creates small boundaries for ordinary leaf reads. If a dense group of
`.get()` reads would create too many tiny boundaries, wrap the group in a manual
`Memo`:

```tsx
import { Memo } from "@usels/core";

<Memo>
  <span>{cart$.total.get()}</span>
  <span>{cart$.tax.get()}</span>
  <span>{cart$.shipping.get()}</span>
</Memo>;
```

A user-authored `Memo` is treated as an explicit render boundary. The transform
does not insert additional auto-generated `Memo` boundaries inside it. With
`wrapReactiveChildren` enabled, the transform may still normalize
`<Memo>{value$.get()}</Memo>` to `<Memo>{() => value$.get()}</Memo>`, but the
boundary remains the one you wrote.

Use this only when the reads really belong to one UI update. For independent
rows or fields, prefer `For` or ordinary leaf reads.

## For

Use `For` for observable arrays:

```tsx
import { For } from "@usels/core";

<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>;
```

Avoid mapping over a broad array snapshot when individual rows should update
independently.

## What The Transform Handles

Use the transform for ordinary leaf reads:

```tsx
<p>{profile$.name.get()}</p>
<Button disabled={isSaving$.get()} />
```

Use `For` when the UI structure itself depends on an observable array:

```tsx
<For each={items$}>{(item$) => <Row item$={item$} />}</For>
```

The transform reduces boilerplate. `For` still documents intent and gives a better boundary for lists than an ad-hoc map.

## Related

- [Observable-First Mental Model](/use-legend/guides/observable-first-mental-model/) — why leaf-bound reads avoid component-wide re-renders.
- [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/) — how the transform wraps JSX reads.
- [Derived State & Effects](/use-legend/guides/patterns/derived-state-and-effects/) — applied patterns that feed reactive reads into rendering boundaries.
