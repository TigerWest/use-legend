# Auto-Tracking & the Babel Plugin

## How It Works

The `@usels/vite-plugin` Babel plugin walks JSX and, for each `.get()` **method call** (MemberExpression), wraps the enclosing expression into a reactive `<Memo>` leaf. When the observable emits a new value, only the leaf re-renders -- the parent component does not re-execute.

Conceptually, this:

```tsx
function Counter() {
  const count$ = useObservable(0);
  return <span>Count: {count$.get()}</span>;
}
```

Behaves as if you had written:

```tsx
function Counter() {
  const count$ = useObservable(0);
  return <span>Count: <Memo>{() => count$.get()}</Memo></span>;
}
```

## What Gets Tracked

- `.get()` inside a JSX expression (`{count$.get()}`) -- tracked.
- `.get()` inside a ternary in JSX (`<>{flag$.get() ? <A /> : <B />}</>`) -- tracked.
- `.get()` passed as a prop value (`<Child value={obs$.get()} />`) -- tracked. The child's prop updates without re-rendering the parent.
- `.get()` inside `useObservable(() => ...)` -- tracked (Legend-State's own tracking, not the plugin).
- `.get()` in a bare return ternary (`return flag$.get() ? ... : ...`) -- **NOT tracked**. Wrap in a fragment.

## What Does NOT Get Tracked

- **`get()` function calls** -- `get(props).field` is a plain function call. The plugin only detects `.get()` MemberExpression (`obj.get()`), not CallExpression (`get(obj)`). No Memo boundary is created.
- **`.get()` stored in a variable** -- `const x = obs$.get()` creates a dead snapshot. The variable `x` in JSX is not reactive.
- **`.get()` outside JSX** -- plain reads in component body or event handlers are not wrapped by the plugin.

## Source Subset Rule

When a parent element is already wrapped in an auto-generated `Memo` (because its attributes read an observable), any child reading the **same** source does **not** get a second `Memo`. The plugin prunes the inner wrapper.

If a child reads a **different** source, it gets its own independent `Memo`:

```tsx
// theme$ and count$ are different sources -> two independent Memo boundaries
<div className={theme$.get()}>
  {count$.get()}
</div>
```

Rule: **child sources ⊆ parent sources -> child Memo pruned**.

## Common Pitfalls

### Bare return ternary

```tsx
// ❌ Not inside JSX -- plugin does not track
return error$.get() ? <ErrorView /> : <MainView />;

// ✅ Fragment wrapper -- puts the ternary inside JSX
return <>{error$.get() ? <ErrorView /> : <MainView />}</>;
```

### Snapshot stored in variable

```tsx
// ❌ Snapshot -- won't re-render
const count = count$.get();
return <span>{count}</span>;

// ✅ Inline -- plugin auto-tracks
return <span>{count$.get()}</span>;
```

### `get()` function in JSX (NOT tracked)

```tsx
// ❌ get() is a function call -- plugin cannot detect it
return <h1>{get(props).title}</h1>;

// ✅ Convert via toObs(), use .get() method
const props$ = toObs(props);  // inside "use scope"
return <h1>{props$.title.get()}</h1>;
```

### `.get().map()` on observable arrays

```tsx
// ❌ Re-renders entire list
{todos$.get().map(todo => <TodoRow key={todo.id} {...todo} />)}

// ✅ Use <For> for per-item reactivity
<For each={todos$}>{(todo$) => <TodoRow todo$={todo$} />}</For>
```

## Decision Table

| What you see in JSX | Plugin detects? | Reactive? |
|---|---|---|
| `obs$.get()` | Yes (MemberExpression) | Yes |
| `obs$.field.get()` | Yes (MemberExpression) | Yes |
| `get(props).field` | No (CallExpression) | No |
| `const x = obs$.get(); {x}` | No (variable) | No |
| `obs$.peek()` | No (peek, not get) | No (by design) |
