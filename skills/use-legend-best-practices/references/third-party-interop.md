# Third-Party Component Integration

## General Rule

When a 3rd-party API requires a React hook or plain value, isolate it in a **leaf component**. Observable values flow **in** via props (call `.get()` at the leaf boundary). Plain values flow **out** via callbacks.

A scope component must never call `.get()` just to satisfy a 3rd-party prop -- that widens the re-render blast radius to the entire parent.

## 1. Passing Values to 3rd-Party Components

Create a thin leaf wrapper that reads `.get()` and passes plain values to the 3rd-party component. The leaf re-renders on data change; the parent stays stable.

```tsx
// ❌ reading .get() in the parent scope component and passing to 3rd party
// widens the re-render scope unnecessarily
function Dashboard() {
  "use scope";
  const data$ = observable(fetchChartData());
  return <ThirdPartyChart data={data$.get()} />;  // parent re-renders too
}

// ✅ thin leaf wrapper isolates the re-render
function Dashboard() {
  "use scope";
  const data$ = observable(fetchChartData());
  return <ChartLeaf data$={data$} />;
}

function ChartLeaf({ data$ }: { data$: Observable<DataPoint[]> }) {
  return <ThirdPartyChart data={data$.get()} />;
}
```

The leaf component has no `"use scope"` -- it is a normal React component. The vite plugin auto-tracks `.get()` in its JSX, so it re-renders only when `data$` changes. The parent scope component never re-renders.

## 2. Ref Forwarding with `Ref$`

`Ref$` (returned by `createRef$`) is callable `(node: T | null) => void` -- compatible with any React ref callback. This means it works with `forwardRef` and any component that accepts `ref` (MUI, Headless UI, Radix, etc.).

Use `createRef$(ref)` to wrap a parent-provided ref -- it forwards to the parent AND allows internal use.

```tsx
import { createRef$ } from "@usels/core";
import { forwardRef } from "react";

const MyInput = forwardRef<HTMLInputElement>((props, ref) => {
  "use scope";
  const el$ = createRef$(ref);   // wraps parent ref -- forwards AND allows internal use
  // el$ can be passed to createElementSize, observe, etc.
  return <input ref={el$} />;
});
```

## 3. Form Libraries (React Hook Form, Formik)

`useForm`, `useFormik`, etc. are React hooks -- they MUST live in a leaf component, never inside `"use scope"`.

- Observable values flow in via props; call `.get()` at the leaf boundary.
- Form results flow out via callbacks.

```tsx
function UserSettings() {
  "use scope";
  const userName$ = observable("Kim");
  const handleSave = (data: FormData) => {
    userName$.set(data.name);
  };
  return <UserFormLeaf defaultName$={userName$} onSave={handleSave} />;
}

// Leaf component -- uses useForm (React hook), NOT a scope component
function UserFormLeaf({ defaultName$, onSave }: {
  defaultName$: Observable<string>;
  onSave: (data: FormData) => void;
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: { name: defaultName$.get() },
  });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <input {...register("name")} />
      <button type="submit">Save</button>
    </form>
  );
}
```

## 4. Router Integration (React Router, TanStack Router)

`useNavigate`, `useParams`, `useSearchParams` are React hooks -- leaf component only.

```tsx
// Leaf -- reads observable, calls router hook
function NavigationLeaf({ targetPath$ }: { targetPath$: Observable<string> }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(targetPath$.peek())}>Go</button>;
}
```

Note: `targetPath$.peek()` is correct here -- event handlers are imperative contexts, not reactive. Use `.peek()` in handlers, `.get()` in JSX.

## Decision Table

| 3rd-party need | Pattern |
|---|---|
| Component accepts plain values | Thin leaf wrapper: pass `obs$` as prop, call `.get()` in leaf JSX |
| Component accepts `ref` | `createRef$(parentRef)` inside scope, or `useRef$()` in leaf |
| Library requires React hooks (`useForm`, `useNavigate`) | Isolate in leaf component -- no `"use scope"` |
| Library fires callbacks with results | Pass callback from scope parent; call `.set()` inside the callback |

## Anti-pattern: React Hooks in Scope for 3rd-Party Integration

```tsx
// ❌ useForm is a React hook -- banned inside "use scope"
function BadForm() {
  "use scope";
  const { register, handleSubmit } = useForm();  // silent breakage
  return <form onSubmit={handleSubmit(onSave)}><input {...register("name")} /></form>;
}

// ❌ useNavigate is a React hook -- banned inside "use scope"
function BadNav() {
  "use scope";
  const navigate = useNavigate();  // silent breakage
  return <button onClick={() => navigate("/home")}>Go</button>;
}

// ✅ extract to leaf components (see patterns above)
```
