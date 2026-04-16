---
title: Auto-Tracking & .get()
description: How the babel plugin turns .get() calls into fine-grained reactive reads.
---

Calling `observable$.get()` inside JSX looks like a plain synchronous read, but the `@usels/vite-plugin` Babel plugin rewrites each JSX-positioned `.get()` into a fine-grained memoized leaf. The component function renders once; only the leaves that read changed observables update.

## How It Works

The plugin walks your JSX and, for each `.get()` expression, wraps the enclosing expression into a reactive leaf. When the observable emits a new value, the leaf re-renders itself — the parent component does not re-execute.

Conceptually, this:

```tsx
function Counter() {
  const count$ = useObservable(0);
  return <span>Count: {count$.get()}</span>;
}
```

Behaves as if you had written (schematically — this is not the literal transform output):

```tsx
function Counter() {
  const count$ = useObservable(0);
  return <span>Count: <Memo>{() => count$.get()}</Memo></span>;
}
```

You keep the straightforward syntax; the plugin does the wrapping.

## What Gets Tracked

- `.get()` inside a JSX expression (`{count$.get()}`) — tracked.
- `.get()` inside a ternary wrapped in JSX (`<>{flag$.get() ? <A /> : <B />}</>`) — tracked.
- `.get()` passed as a prop value to a child component — tracked. The child's prop updates without re-rendering the parent.
- `.get()` inside a `useObservable(() => ...)` computed — tracked (this is Legend-State's own tracking, not the plugin).
- `.get()` passed as a function-call argument inside JSX — tracked at the call site.
- `.get()` in a bare return ternary (`return flag$.get() ? ... : ...`) — **not tracked**. Wrap in a fragment.

## No Nested Memo Wrapping (Source Subset Rule)

When a parent element is already wrapped in an auto-generated `Memo` because its attributes read an observable, any child inside that boundary reading the **same** observable (or a subset of the parent's sources) does **not** get a second `Memo`. The plugin prunes the inner wrapper because it would be redundant — the parent boundary already re-renders when that source changes.

```tsx
// theme$.get() appears in both the parent attribute and the child text.
// The plugin wraps the <div> in one Memo and removes the inner child Memo.

// What you write:
<div className={theme$.get()}>
  {theme$.get()}
</div>

// What the plugin produces (conceptually):
<Memo>{() => <div className={theme$.get()}>{theme$.get()}</div>}</Memo>
```

If a child reads a **different** source that the parent does not track, the child gets its own independent `Memo`:

```tsx
// theme$ and count$ are different sources → two independent Memo boundaries.

// What the plugin produces (conceptually):
<Memo>{() =>
  <div className={theme$.get()}>
    <Memo>{() => count$.get()}</Memo>
  </div>
}</Memo>
```

The rule is: **child sources ⊆ parent sources → child Memo is pruned**. This prevents redundant reactive boundaries without losing independent granularity when sources differ.

## Common Pitfalls

**Bare return ternaries are not tracked.**

The plugin only detects `.get()` calls that appear inside JSX. A ternary at the return statement level is plain JavaScript, not JSX — the plugin cannot wrap it:

```tsx
// ❌ Bare return — not inside JSX, plugin does not track
return error$.get() ? <ErrorView /> : <MainView />;

// ✅ Fragment wrapper — puts the ternary inside JSX
return <>{error$.get() ? <ErrorView /> : <MainView />}</>;
```

Always wrap conditional returns in a fragment (`<>...</>`) so the `.get()` call lands inside the plugin's detection scope.

**Storing `.get()` in a variable defeats tracking.**

```tsx
function Counter() {
  const count$ = useObservable(0);
  const count = count$.get(); // snapshot taken at render time
  return <span>Count: {count}</span>; // not reactive — won't update
}
```

Use `count$.get()` inline in the JSX instead.

**`.get().map()` re-renders the entire list.** Use `<For each={obs$}>` for observable arrays — see [Rendering Boundaries → For](/use-legend/guides/concepts/rendering-boundaries/#for).

**`.get()` outside JSX or outside a reactive context is a plain read.** If you need to react to changes as a side-effect, use `useObserve`. If you need a derived observable, use `useObservable(() => ...)`.

## Setup

This plugin is wired through your bundler. Pick the integration matching your stack:

- [Tooling → Vite](/use-legend/guides/tooling/vite/)
- [Tooling → Babel / Next.js](/use-legend/guides/tooling/babel-nextjs/)

## Related

- [Observable-First Mental Model](/use-legend/guides/observable-first-mental-model/) — why observables instead of `useState`.
- [Rendering Boundaries](/use-legend/guides/concepts/rendering-boundaries/) — the mental model for fine-grained updates.
