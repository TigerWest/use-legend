---
title: Rendering Boundaries
description: Use Memo, Show, Computed, and For to keep observable reads fine-grained.
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

### Coarsen a Boundary Manually

If a dense group of `.get()` reads would create too many tiny auto-wrapped
boundaries, wrap the group in a manual `Memo`:

```tsx
import { Memo } from "@usels/core";

<Memo>
  <span>{cart$.total.get()}</span>
  <span>{cart$.tax.get()}</span>
  <span>{cart$.shipping.get()}</span>
</Memo>;
```

A user-authored `Memo` is treated as an explicit render boundary. The transform
does not insert additional auto-generated `Memo` boundaries inside it.

Use this only when the reads really belong to one UI update. For independent
rows or fields, prefer `For` or ordinary leaf reads.

## Show

`Show` is a conditional rendering boundary. It only re-renders its children when
the condition observable changes — the parent component stays untouched:

```tsx
import { Show } from "@usels/core";

<Show if={isLoggedIn$}>
  <Dashboard />
</Show>;
```

Use `else` for the falsy branch:

```tsx
<Show if={isLoading$} else={<Content data$={data$} />}>
  <p>Loading…</p>
</Show>;
```

Prefer `Show` over inline conditionals like `{obs$.get() && <JSX>}` — the inline
form re-renders the parent component on every change.

## Computed

`Computed` creates a reactive boundary around arbitrary JSX. It re-renders only
itself when any observable read inside changes — the parent component is not
affected:

```tsx
import { Computed } from "@usels/core";

<Computed>
  {() => (
    <span>
      {firstName$.get()} {lastName$.get()}
    </span>
  )}
</Computed>;
```

`Computed` tracks any observable state change, not just derived values. With the
transform enabled, most leaf reads are auto-wrapped — use `Computed` when you
need an explicit reactive boundary around a block of JSX.

## For

Use `For` for observable arrays. Each item gets its own boundary so individual
rows update independently:

```tsx
import { For } from "@usels/core";

<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>;
```

Avoid `.get().map()` — it re-renders the entire list when any item changes.

## Choosing the Right Boundary

| Scenario | Boundary |
|----------|----------|
| Ordinary leaf reads in JSX | Auto-wrapped by the transform |
| Group of related reads that update together | `Memo` (manual) |
| Conditional rendering | `Show` |
| Explicit reactive block of JSX | `Computed` |
| Observable array iteration | `For` |

## Related

- [Observable-First Mental Model](/use-legend/guides/observable-first-mental-model/) — why leaf-bound reads avoid component-wide re-renders.
- [Auto-Tracking & `.get()`](/use-legend/guides/concepts/auto-tracking/) — how the transform wraps JSX reads.
- [Derived State & Effects](/use-legend/guides/patterns/derived-state-and-effects/) — applied patterns that feed reactive reads into rendering boundaries.
