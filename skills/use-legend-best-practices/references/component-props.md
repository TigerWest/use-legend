# Observable Props & Data Flow

## Core Rules

- Define the raw prop interface with plain types -- no `$` suffixes on fields.
- Apply `DeepMaybeObservable<T>` at the **parameter** level, not per-field.
- Intermediate components receive and **pass through** observable fields as-is -- never eagerly unwrap.
- Use `get(props).field` for a **reactive** read (registers tracking dependency).
- Use `peek(props).field` for a **non-reactive** read (no tracking, always latest).
- `children` is always a normal React prop, never observable. Access via `get({ children }).children as ReactNode` or destructure directly.
- Callbacks: access via `peek(props).onCallback` -- non-reactive, always the latest reference.

## Typing Pattern

```tsx
import { get, peek, type DeepMaybeObservable } from "@usels/core";
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
function Card({ title, subtitle, onPress, children }: DeepMaybeObservable<CardProps>) {
  return (
    <div onClick={() => peek({ onPress }).onPress?.()}>
      <CardTitle title={title} />        {/* pass through -- no .get() */}
      <CardSubtitle subtitle={subtitle} />
      {get({ children }).children as ReactNode}
    </div>
  );
}
```

## Data Flow

```
Root ("use scope")          --> creates observable state
  +-- Intermediate          --> receives DeepMaybeObservable<Props>, passes through
       +-- Leaf             --> calls get() / .get() inline in JSX for rendering
```

- **Root**: creates observables via `useScope` or `observable()`.
- **Intermediate**: receives `DeepMaybeObservable<Props>`, forwards fields to children untouched.
- **Leaf**: reads values reactively with `get(props).field` or `.get()` inline in JSX. The babel plugin auto-tracks these calls.

## Anti-pattern: Eager Unwrap in Intermediate Components

```tsx
// BAD -- intermediate component kills reactivity; title becomes a snapshot
function CardContainer(props: DeepMaybeObservable<CardProps>) {
  const title = get(props).title;  // snapshot at intermediate level
  return <Card title={title} />;   // child never re-renders on title change
}

// GOOD -- pass through; let the leaf read
function CardContainer(props: DeepMaybeObservable<CardProps>) {
  return <Card title={props.title} />;
}
```

Why: `get(props).title` resolves the value **now** and returns a plain string. Passing that string to `<Card>` means the child component receives a static snapshot. When the original observable changes, the child will not re-render.

Passing `props.title` preserves the `MaybeObservable<string>` wrapper. The leaf component calls `get()` inline, which registers a reactive tracking dependency at the right level.

## `children` Handling

`children` is always a normal React prop. Never attempt to make it observable.

```tsx
// GOOD -- destructure directly
function Wrapper({ children, ...rest }: DeepMaybeObservable<WrapperProps>) {
  return <div>{children}</div>;
}

// GOOD -- extract via get() wrapper
function Wrapper({ title, children }: DeepMaybeObservable<WrapperProps>) {
  return (
    <div>
      <h1>{get({ title }).title}</h1>
      {get({ children }).children as ReactNode}
    </div>
  );
}
```

## Callback Handling

Callbacks should be accessed via `peek()` -- non-reactive, always the latest reference. Never use `get()` for callbacks; there is no reason to track them reactively.

```tsx
// GOOD -- peek for callbacks in event handlers
function Toggle(props: DeepMaybeObservable<ToggleProps>) {
  return (
    <button onClick={() => peek(props).onToggle?.()}>
      {get(props).label}
    </button>
  );
}

// GOOD -- destructure with peek() when multiple callbacks are needed
function Form(props: DeepMaybeObservable<FormProps>) {
  const handleSubmit = () => {
    const { onSubmit, onValidate } = peek(props);
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
| Render a prop value in JSX | `get(props).field` or inline `.get()` | Yes |
| Pass prop to a child component | `props.field` (pass through) | Preserved |
| Fire a callback | `peek(props).onCallback?.()` | No |
| Access `children` | destructure or `get({ children }).children as ReactNode` | No |
| One-time mount read | `peek(props).field` | No |
