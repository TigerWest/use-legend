# useLocalStorage

> Part of `@usels/web` | Category: Browser

## Overview

Reactive `localStorage` binding. Thin wrapper around `createStorage` with `ObservablePersistLocalStorage` as the persist plugin.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useLocalStorage } from "@usels/web";

    function Component() {
      const count$ = useLocalStorage("count", 0);

      return (
        <button onClick={() => count$.set(count$.get() + 1)}>Count: {count$.get()}</button>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createLocalStorage } from "@usels/web";

    function Component() {
      "use scope"
      const count$ = createLocalStorage("count", 0);

      return (
        <button onClick={() => count$.set(count$.get() + 1)}>Count: {count$.get()}</button>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Persisting object values

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const profile$ = useLocalStorage("profile", { name: "", age: 0 });

    profile$.name.set("Alice");
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function Component() {
      "use scope"
      const profile$ = createLocalStorage("profile", { name: "", age: 0 });

      profile$.name.set("Alice");
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createLocalStorage } from "./core";
export type UseLocalStorage = typeof createLocalStorage;
export declare const useLocalStorage: UseLocalStorage;
```

## Source

- Implementation: `packages/web/src/browser/useLocalStorage/index.ts`
- Documentation: `packages/web/src/browser/useLocalStorage/index.mdx`