# Mixing Scope & Normal React

How `"use scope"` components coexist with normal React hooks and non-scope components. Six principles, ordered from most critical to least.

---

## Principle 1: No React Hooks Inside `"use scope"`

Absolute rule, no exceptions. The scope factory runs once at mount. React hooks called inside it violate hook ordering guarantees and silently corrupt reactivity.

| Instead of (hook) | Use (scope) |
|---|---|
| `useObservable(init)` | `observable(init)` |
| `useRef$()` | `createRef$()` |
| `useObserve(fn)` | `observe(fn)` |
| `useEffect(fn, [])` | `onMount(fn)` |
| `useState(init)` | `observable(init)` |

> **WARNING:** No static checker catches this. No runtime error. The component appears to work but updates are broken. React Strict Mode may surface the issue; regular mode will not. This is silent corruption.

```tsx
// ❌ silent breakage -- looks correct, reactivity is dead
function Bad() {
  "use scope";
  const [name, setName] = useState("Kim");
  const obs$ = useObservable(0);
  useEffect(() => { /* ... */ }, []);
}

// ✅ scope equivalents
function Good() {
  "use scope";
  const name$ = observable("Kim");
  const obs$ = observable(0);
  onMount(() => { /* ... */ });
}
```

---

## Principle 2: Normal React Hooks Belong in Leaf Components Only

`useState`, `useReducer`, `useMemo`, `useCallback`, `useRef` -- leaf components only.
External library hooks (`useQuery`, `useForm`, `useNavigate`, `useTranslation`) -- leaf components only.

**Why:** React state triggers component re-render. If placed in a parent, the entire subtree re-renders, defeating observable fine-grained reactivity.

**Pattern:** extract a small leaf component that contains the hook and re-renders in isolation.

```tsx
// ❌ useState in parent -- entire subtree re-renders on tab change
function Dashboard() {
  "use scope";
  const data$ = observable(fetchData());
  const [tab, setTab] = useState("overview");  // BANNED in scope, AND kills subtree reactivity
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
      <TabSelector />
      <DataView data={data$} />
    </div>
  );
}

function TabSelector() {
  const [tab, setTab] = useState("overview");
  return <Tabs value={tab} onChange={setTab} />;
}
```

---

## Principle 3: Observable to React Hook Direction

A leaf component reads `.get()` inline -- the value flows to the React hook as a plain argument. The leaf re-renders when the observable changes (vite plugin tracks `.get()`). The React hook receives the new value and reacts normally.

```tsx
// Leaf component -- bridges observable to useQuery
function UserQueryLeaf({ userId$ }: { userId$: Observable<string> }) {
  const data = useQuery({ queryKey: ["user", userId$.get()], queryFn: fetchUser });
  return <UserCard data={data} />;
}
```

`userId$.get()` is inline in the hook argument, so the vite plugin auto-tracks it. When `userId$` changes, the leaf re-renders, `useQuery` receives the new key, and refetches.

---

## Principle 4: React Hook to Observable Direction (Minimize)

If React hook state must flow back to the observable world, call `.set()` from a handler or effect in the leaf. Prefer observable-native solutions first (e.g., use a core `create*` function instead of a React hook when one is available).

```tsx
function SearchLeaf({ query$ }: { query$: Observable<string> }) {
  const [localInput, setLocalInput] = useState("");
  const handleSubmit = () => query$.set(localInput);  // leaf -> observable
  return (
    <form onSubmit={handleSubmit}>
      <input value={localInput} onChange={e => setLocalInput(e.target.value)} />
    </form>
  );
}
```

The leaf owns the React state (`localInput`). The observable world only receives the value on explicit action (submit). This keeps the boundary clean and minimizes React-to-observable coupling.

---

## Principle 5: Non-scope Child Components

Pass plain values, not `DeepMaybeObservable`. Call `.get()` at the boundary (parent scope component) to unwrap. Non-scope children are normal React components -- they re-render on prop change as usual.

```tsx
// ❌ passing observable to non-scope child -- child cannot read it
function ScopeParent() {
  "use scope";
  const user$ = observable({ name: "Kim", age: 30 });
  return <PlainChild name={user$.name} age={user$.age} />;
}

// ✅ unwrap at boundary for non-scope child
function ScopeParent() {
  "use scope";
  const user$ = observable({ name: "Kim", age: 30 });
  return <PlainChild name={user$.name.get()} age={user$.age.get()} />;
}

function PlainChild({ name, age }: { name: string; age: number }) {
  return <p>{name} ({age})</p>;
}
```

---

## Principle 6: Non-scope Parent with Scope Child

A scope child receives plain props and internally wraps them with `observable()`. This works naturally -- the scope child is self-contained.

```tsx
// Normal React parent -- no scope
function App() {
  const [name, setName] = useState("Kim");
  return <ScopeChild name={name} />;
}

// Scope child -- receives plain prop, works fine
function ScopeChild({ name }: { name: string }) {
  "use scope";
  const greeting$ = observable(() => `Hello, ${name}`);
  return <p>{greeting$.get()}</p>;
}
```

When the parent re-renders with a new `name`, the scope child's vite plugin transform handles the prop update -- `greeting$` recomputes reactively.

---

## Quick Reference

| Scenario | Rule |
|---|---|
| `"use scope"` + React hook | Forbidden. Use scope equivalents (Principle 1) |
| `useState` / `useQuery` / library hooks | Leaf component only (Principle 2) |
| Observable value needed by React hook | `.get()` inline in leaf, pass as plain arg (Principle 3) |
| React hook state needed by observable | `.set()` from handler/effect in leaf (Principle 4) |
| Scope parent with non-scope child | `.get()` at boundary, pass plain values (Principle 5) |
| Non-scope parent with scope child | Pass plain props, scope child handles internally (Principle 6) |
