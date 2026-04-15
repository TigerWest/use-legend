# useManualReset

> Part of `@usels/core` | Category: Reactivity

## Overview

Observable with a manual `reset()` function that restores the value to its default. Unlike `useAutoReset`, the value is only reset when you explicitly call `reset()`.

## Usage

```tsx
import { useManualReset } from "@usels/core";

const { value$, reset } = useManualReset("hello");
value$.set("changed");
// value$.get() returns "changed"

reset();
// value$.get() returns "hello" — restored to default
```

### Observable default value

```tsx
import { useManualReset, useObservable } from "@usels/core";

// When defaultValue is an Observable, reset() reads its current value
const default$ = useObservable("initial");
const { value$, reset } = useManualReset(default$);

value$.set("changed");
default$.set("updated-default");
reset();
// value$.get() returns "updated-default" — not the stale "initial"
```

### Form reset pattern

```tsx
import { useManualReset } from "@usels/core";

function MyForm() {
  const { value$: name$, reset: resetName } = useManualReset("");
  const { value$: email$, reset: resetEmail } = useManualReset("");

  const handleSubmit = () => {
    // submit form...
    resetName();
    resetEmail();
  };
}
```

## Type Declarations

```typescript
export { createManualReset } from "./core";
export declare function useManualReset<T>(defaultValue: MaybeObservable<T>): {
    value$: Observable<WidenPrimitive<T>>;
    reset: Fn;
};
```

## Source

- Implementation: `packages/core/src/reactivity/useManualReset/index.ts`
- Documentation: `packages/core/src/reactivity/useManualReset/index.md`