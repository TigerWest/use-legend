# useSessionStorage

> Part of `@usels/web` | Category: Browser

## Overview

Reactive `sessionStorage` binding. Thin wrapper around `createStorage` with `ObservablePersistSessionStorage` as the persist plugin. Values persist only for the current browser session.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useSessionStorage } from "@usels/web";

    function Component() {
      const step$ = useSessionStorage("wizard-step", 1);

      return (
        <div>
          <p>Step: {step$.get()}</p>
          <button onClick={() => step$.set(step$.get() + 1)}>Next</button>
        </div>
      );
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createSessionStorage } from "@usels/web";

    function Component() {
      "use scope"
      const step$ = createSessionStorage("wizard-step", 1);

      return (
        <div>
          <p>Step: {step$.get()}</p>
          <button onClick={() => step$.set(step$.get() + 1)}>Next</button>
        </div>
      );
    }
    ```

  </Fragment>
</CodeTabs>

### Persisting object values

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    const wizard$ = useSessionStorage("wizard", { step: 1, data: {} });

    wizard$.step.set(2);
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    function Component() {
      "use scope"
      const wizard$ = createSessionStorage("wizard", { step: 1, data: {} });

      wizard$.step.set(2);
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createSessionStorage } from "./core";
export type UseSessionStorage = typeof createSessionStorage;
export declare const useSessionStorage: UseSessionStorage;
```

## Source

- Implementation: `packages/web/src/browser/useSessionStorage/index.ts`
- Documentation: `packages/web/src/browser/useSessionStorage/index.mdx`