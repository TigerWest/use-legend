# useDebounced

> Part of `@usels/core` | Category: Reactivity

## Overview

Debounce an Observable value. Creates a read-only Observable that updates only after the source value stops changing for the specified delay.

## Usage

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";

const source$ = useObservable("hello");
const debounced$ = useDebounced(source$, 300);
// debounced$.get() updates 300ms after source$ stops changing
```

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";

const source$ = useObservable(0);
const debounced$ = useDebounced(source$, 300, { maxWait: 1000 });
// Forces update every 1000ms even with continuous source changes
```

```tsx
import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";

const source$ = useObservable("hello");
const delay$ = useObservable(300);
const debounced$ = useDebounced(source$, delay$);
// Changing delay$ applies from the next debounce cycle
```

## Type Declarations

```typescript
export { createDebounced } from "./core";
export declare function useDebounced<T>(value: MaybeObservable<T>, ms?: MaybeObservable<number>, options?: DebounceFilterOptions): ReadonlyObservable<T>;
```

## Source

- Implementation: `packages/core/src/reactivity/useDebounced/index.ts`
- Documentation: `packages/core/src/reactivity/useDebounced/index.md`