# createProvider

> Part of `@usels/core` | Category: Utilities

## Overview

Collapses React Context + Provider component + useContext hook into a single call. Eliminates boilerplate when sharing hook state via React Context.

## Usage

### Basic — wrap a hook

```tsx
import { createProvider, useObservable } from "@usels/core";

function useCounterSetup(props: { initial: number }) {
  const count$ = useObservable(props.initial);
  return { count$, inc: () => count$.set((v) => v + 1) };
}

const [CounterProvider, useCounter] = createProvider(useCounterSetup);

// In your app
function App() {
  return (
    <CounterProvider initial={0}>
      <Child />
    </CounterProvider>
  );
}

function Child() {
  const { count$, inc } = useCounter();
  return <button onClick={inc}>{count$.get()}</button>;
}
```

### Non-strict mode — optional Provider

By default, calling `useContext` outside a Provider throws.
Set `strict: false` to return `undefined` instead.

```tsx
import { createProvider } from "@usels/core";

const [OptionalProvider, useMaybeValue] = createProvider(
  (props: { value: string }) => props.value,
  { strict: false }
);

function Child() {
  const ctx = useMaybeValue(); // string | undefined — no throw
}
```

### Custom displayName

```tsx
import { createProvider, useObservable } from "@usels/core";

const [ThemeProvider, useTheme] = createProvider(
  (props: { mode: "light" | "dark" }) => {
    const theme$ = useObservable(props.mode);
    return { theme$, toggle: () => theme$.set((v) => (v === "light" ? "dark" : "light")) };
  },
  { name: "Theme" }
);
```

### getHook — call from inside `useScope` / `"use scope"`

The third tuple entry `getHook` is a non-hook accessor for the provided value.
Use it inside a `useScope` factory (or a `"use scope"` directive body) where
regular React hooks are disallowed.

```tsx
import { computed, createProvider, observable } from "@usels/core";

const [ThemeProvider, useTheme, getTheme] = createProvider(({ color }: { color: string }) =>
  observable({ color })
);

function useThemeClass() {
  "use scope";
  const theme$ = getTheme();
  return { className$: computed(() => `theme-${theme$.color.get()}`) };
}
```

Rules:

- Must be called **synchronously** during the first run of the factory.
- Must be called under the matching Provider; otherwise throws in strict mode
  or returns `undefined` in non-strict mode.
- Returns the raw provided value (same as `useHook`). For reactivity, provide
  an Observable from the composable — its reference stays stable and `observe()`
  inside the scope reacts to field changes.

## Type Declarations

```typescript
export interface CreateProviderOptions {
    name?: string;
    strict?: boolean;
}
export type CreateProviderReturn<Props, Value> = readonly [
    Provider: React.FC<React.PropsWithChildren<Props>>,
    useHook: () => Value,
    getHook: () => Value
];
export type CreateProviderNullableReturn<Props, Value> = readonly [
    Provider: React.FC<React.PropsWithChildren<Props>>,
    useHook: () => Value | undefined,
    getHook: () => Value | undefined
];
export declare function createProvider<Props extends Record<string, any>, Value>(composable: (props: Props) => Value, options?: CreateProviderOptions & {
    strict?: true;
}): CreateProviderReturn<Props, Value>;
export declare function createProvider<Props extends Record<string, any>, Value>(composable: (props: Props) => Value, options: CreateProviderOptions & {
    strict: false;
}): CreateProviderNullableReturn<Props, Value>;
```

## Source

- Implementation: `packages/core/src/utilities/createProvider/index.ts`
- Documentation: `packages/core/src/utilities/createProvider/index.mdx`