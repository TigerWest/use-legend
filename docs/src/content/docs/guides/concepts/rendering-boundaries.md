---
title: Rendering Boundaries
description: Use Memo, Show, For, and the transform to keep observable reads fine-grained.
---

Observable state only helps rendering if reads happen inside a reactive boundary.
`use-legend` gives you explicit boundaries and a transform that can create common
boundaries automatically.

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
rows, branches, or fields, prefer `For`, `Show`, or ordinary leaf reads.

## Show

Use `Show` for observable conditionals:

```tsx
import { Show } from "@usels/core";

<Show if={isLoading$} else={<Content />}>
  <Spinner />
</Show>;
```

This keeps the conditional branch as the update boundary.

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

Use explicit components when the UI structure itself depends on an observable:

```tsx
<Show if={isOpen$}>
  <Panel />
</Show>

<For each={items$}>{(item$) => <Row item$={item$} />}</For>
```

The transform reduces boilerplate. `Show` and `For` still document intent and
give better boundaries for conditions and lists.
