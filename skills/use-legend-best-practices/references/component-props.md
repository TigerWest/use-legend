# Observable Props & Data Flow

## Core Rules

- Define the raw prop interface with plain types -- no `$` suffixes on fields.
- Apply `DeepMaybeObservable<T>` at the **parameter** level, not per-field.
- Inside `"use scope"`, convert props to Observable via `toObs()` -- then use `.get()` method for reactive reads.
- **Never use `get()` function in JSX** -- `get()` is a plain function call, not a `.get()` MemberExpression. The Babel plugin only auto-tracks `.get()` method calls. `get(props).field` in JSX will NOT create a reactive Memo boundary.
- Intermediate components receive and **pass through** observable fields as-is -- never eagerly unwrap.
- `children` is always a normal React prop, never observable. Destructure it directly.
- Callbacks: access via `peek(props).onCallback` or `props$.peek().onCallback` -- non-reactive, always the latest reference.

## `get()` / `peek()` Function: Where They Belong

The `get()` and `peek()` utility functions from `@usels/core` normalize `DeepMaybeObservable<T>` values. They are **not** autoWrap-compatible -- the Babel plugin does not detect them.

| Context | Use `get()`/`peek()` function? | Use `.get()` method? |
|---|---|---|
| Inside `observe()` / computed `observable(() => ...)` | Yes -- reactive context, tracking works | Yes |
| JSX expressions (`{...}`) | **No** -- plugin cannot detect, no Memo boundary | **Yes** -- plugin auto-wraps |
| Event handlers | Use `peek()` / `.peek()` | Use `.peek()` |

## Typing Pattern

```tsx
import { toObs } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import type { ReactNode } from "react";

// 1. Define raw interface -- plain types, no $ suffixes
interface CardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  children?: ReactNode;
}

// 2. DeepMaybeObservable wraps the raw type at the parameter level.
//    Callers can pass plain values, per-field observables, or an outer Observable<CardProps>.
function Card({ children, ...rest }: DeepMaybeObservable<CardProps>) {
  "use scope";
  const props$ = toObs(rest);

  return (
    <div onClick={() => props$.onPress.peek()?.()}>
      <CardTitle title={props$.title} />   {/* pass Observable field -- no .get() */}
      <CardSubtitle subtitle={props$.subtitle} />
      {children}
    </div>
  );
}
```

## Data Flow

```
Root ("use scope")          --> creates observable state
  +-- Intermediate          --> receives DeepMaybeObservable<Props>, passes through
       +-- Leaf             --> converts via toObs(), calls .get() inline in JSX
```

- **Root**: creates observables via `"use scope"` or `observable()`.
- **Intermediate**: receives `DeepMaybeObservable<Props>`, forwards fields to children untouched.
- **Leaf**: converts props via `toObs()`, reads values with `.get()` inline in JSX. The babel plugin auto-tracks `.get()` method calls.

## Anti-pattern: `get()` Function in JSX

```tsx
// ❌ BAD -- get() is a function call, Babel plugin cannot detect it
// No Memo boundary created, no fine-grained reactivity
function Card(props: DeepMaybeObservable<CardProps>) {
  return <h1>{get(props).title}</h1>;
}

// ✅ GOOD -- toObs() + .get() method, Babel plugin auto-tracks
function Card(props: DeepMaybeObservable<CardProps>) {
  "use scope";
  const props$ = toObs(props);
  return <h1>{props$.title.get()}</h1>;
}
```

## Anti-pattern: Eager Unwrap in Intermediate Components

```tsx
// ❌ BAD -- intermediate component kills reactivity; title becomes a snapshot
function CardContainer(props: DeepMaybeObservable<CardProps>) {
  "use scope";
  const props$ = toObs(props);
  const title = props$.title.get();     // snapshot at intermediate level
  return <Card title={title} />;        // child never re-renders on title change
}

// ✅ GOOD -- pass through; let the leaf read
function CardContainer(props: DeepMaybeObservable<CardProps>) {
  return <Card title={props.title} />;
}
```

Why: `.get()` resolves the value **now** and returns a plain string. Passing that string to `<Card>` means the child component receives a static snapshot. When the original observable changes, the child will not re-render.

Passing `props.title` preserves the `MaybeObservable<string>` wrapper. The leaf component converts via `toObs()` and calls `.get()` inline, which registers a reactive tracking dependency at the right level.

## `children` Handling

`children` is always a normal React prop. Never attempt to make it observable. Destructure it before passing the rest to `toObs()`.

```tsx
// ✅ GOOD -- destructure children, toObs the rest
function Wrapper({ children, ...rest }: DeepMaybeObservable<WrapperProps>) {
  "use scope";
  const props$ = toObs(rest);
  return (
    <div>
      <h1>{props$.title.get()}</h1>
      {children}
    </div>
  );
}
```

## Callback Handling

Callbacks should be accessed via `.peek()` -- non-reactive, always the latest reference. Never use `.get()` for callbacks; there is no reason to track them reactively.

```tsx
// ✅ GOOD -- .peek() for callbacks in event handlers
function Toggle(props: DeepMaybeObservable<ToggleProps>) {
  "use scope";
  const props$ = toObs(props);
  return (
    <button onClick={() => props$.onToggle.peek()?.()}>
      {props$.label.get()}
    </button>
  );
}

// ✅ GOOD -- peek() when multiple callbacks are needed
function Form(props: DeepMaybeObservable<FormProps>) {
  "use scope";
  const props$ = toObs(props);
  const handleSubmit = () => {
    const { onSubmit, onValidate } = props$.peek();
    if (onValidate?.()) {
      onSubmit?.();
    }
  };
  return <button onClick={handleSubmit}>Submit</button>;
}
```

## Quick Reference

| What you need | How to access | Reactive? |
|---|---|---|
| Render a prop value in JSX | `props$.field.get()` (after `toObs()`) | Yes (autoWrap) |
| Pass prop to a child component | `props.field` (pass through) | Preserved |
| Fire a callback | `props$.onCallback.peek()?.()` | No |
| Access `children` | destructure directly | No |
| One-time mount read | `props$.peek().field` | No |
| Read in `observe()` / computed | `props$.get().field` or `props$.field.get()` | Yes (reactive context) |
