# Rendering Boundaries

## `<For>` -- List Rendering

Observable arrays MUST use `<For each={arr$}>`. Never call `.get().map()` or `.map()` on an observable array -- both destroy fine-grained per-item reactivity.

Each child receives `item$`, an Observable proxy for that item. Updates to one item re-render only that item's subtree.

```tsx
import { For } from "@legendapp/state/react";

// ❌ .get().map() -- entire list re-renders on any item change
{todos$.get().map(todo => <TodoRow key={todo.id} {...todo} />)}

// ❌ .map() on observable array -- no fine-grained tracking
{todos$.map(todo$ => <TodoRow key={todo$.id.get()} title={todo$.title.get()} />)}

// ✅ <For> -- each item tracked independently
<For each={todos$}>
  {(todo$) => <TodoRow id={todo$.id} title={todo$.title} completed={todo$.completed} />}
</For>
```

## `<Show>` -- Conditional Rendering

Observable conditions MUST use `<Show if={cond$}>`. Never use `cond$.get() && <JSX/>` or ternary `cond$.get() ? <A/> : <B/>` -- both force the parent component to re-render on every condition change.

Use the `else` prop for a fallback branch.

```tsx
import { Show } from "@legendapp/state/react";

// ❌ inline conditional -- re-renders entire component
{isLoading$.get() ? <Spinner /> : <Content />}
{error$.get() && <ErrorBanner />}

// ✅ <Show> -- only re-renders children when condition changes
<Show if={isLoading$} else={<Content />}>
  <Spinner />
</Show>
<Show if={error$}>
  <ErrorBanner message={error$.get()?.message} />
</Show>
```

## `<Memo>` -- Manual Memo Boundary

By default, `@usels/vite-plugin` auto-tracks every `.get()` call in JSX. This means most components are already fine-grained -- `<Memo>` is **not** needed to "make `.get()` reactive."

Use `<Memo>` ONLY when you need to manually isolate an expensive subtree so that its re-renders are independent of the surrounding component.

```tsx
import { Memo } from "@legendapp/state/react";

// ❌ unnecessary -- vite plugin already auto-tracks .get()
<Memo>{() => <span>{count$.get()}</span>}</Memo>

// ✅ only when manually controlling memo boundary for specific subtree
<Memo>
  {() => <ExpensiveChart data={chartData$.get()} />}
</Memo>
```

## Normal State Hooks at Leaf Only

> **CRITICAL** -- this is the most common way to silently destroy observable reactivity.

`useState`, `useReducer`, `useContext`, and any external hooks that cause re-renders belong in **leaf components ONLY**.

If a parent component uses `useState`, every state change re-renders the parent **and its entire subtree**. All observable fine-grained reactivity below that parent is wiped out because React's reconciliation re-executes every child.

**Pattern:** extract the part needing React state into a small leaf component that re-renders in isolation.

```tsx
// ❌ useState in parent -- entire tree re-renders on tab change
function Dashboard() {
  "use scope";
  const data$ = observable(fetchData());
  const [tab, setTab] = useState("overview");  // BANNED in scope, AND destroys reactivity
  return (
    <div>
      <Tabs value={tab} onChange={setTab} />
      <DataView data={data$} />
    </div>
  );
}

// ✅ useState isolated in leaf -- only TabSelector re-renders
function Dashboard() {
  "use scope";
  const data$ = observable(fetchData());
  return (
    <div>
      <TabSelector />           {/* leaf: contains useState, re-renders itself only */}
      <DataView data={data$} /> {/* scope child: fine-grained, unaffected */}
    </div>
  );
}

function TabSelector() {
  const [tab, setTab] = useState("overview");
  return <Tabs value={tab} onChange={setTab} />;
}
```

**Why this matters:** `DataView` uses observable `data$` for fine-grained updates. When `useState` lives in the parent, a tab change re-renders `DataView` even though its data did not change. Moving `useState` to a leaf component (`TabSelector`) confines re-renders to that leaf alone.

## Decision Table

| Rendering need | Component |
|---|---|
| Observable list | `<For each={arr$}>` |
| Observable condition | `<Show if={cond$}>` |
| Manual memo boundary | `<Memo>` (rarely needed) |
| Needs `useState`/external hook | Extract to leaf component |
