# useScope

> Part of `@usels/core` | Category: Primitives

## Overview



## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { observable, createObserve, onMount, onUnmount, useScope } from "@usels/core";

    function useCounter() {
      return useScope(() => {
        const count$ = observable(0);

        onMount(() => {
          console.log("mounted");
        });

        onUnmount(() => {
          console.log("unmounted");
        });

        return { count$ };
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { observable, onMount, onUnmount } from "@usels/core";

    function useCounter() {
      "use scope"
      const count$ = observable(0);

      onMount(() => {
        console.log("mounted");
      });

      onUnmount(() => {
        console.log("unmounted");
      });

      return { count$ };
    }
    ```

  </Fragment>
</CodeTabs>

### With props

Pass a second argument to receive reactive props inside the factory. `p.field` always returns the latest value without tracking. Use `toObs(p)` to get a reactive `Observable<P>` that updates when props change.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useScope, toObs, createObserve } from "@usels/core";

    function useThemeSync(props: { theme: string }) {
      return useScope((p) => {
        // p.theme — raw latest (no reactive tracking)
        // obs$.theme.get() — reactive, triggers re-observation on change
        const obs$ = toObs(p);

        createObserve(() => {
          document.documentElement.dataset.theme = obs$.theme.get();
        });

        return {};
      }, props);
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { toObs, createObserve } from "@usels/core";

    function useThemeSync(props: { theme: string }) {
      "use scope"
      const obs$ = toObs(props);

      createObserve(() => {
        document.documentElement.dataset.theme = obs$.theme.get();
      });

      return {};
    }
    ```

  </Fragment>
</CodeTabs>

### Lifecycle callbacks

| API             | Timing                        | Notes                                    |
| --------------- | ----------------------------- | ---------------------------------------- |
| `onBeforeMount` | `useLayoutEffect` — pre-paint | DOM measurement, scroll position restore |
| `onMount`       | `useEffect` — after mount     | Returns optional cleanup function        |
| `onUnmount`     | component unmount             | Shorthand for `onMount(() => cleanup)`   |

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useScope, onBeforeMount, onMount, onUnmount } from "@usels/core";

    useScope(() => {
      onBeforeMount(() => {
        // runs at useLayoutEffect timing — before paint
      });

      onMount(() => {
        const sub = source$.onChange(handler);
        return () => sub(); // cleanup runs on unmount
      });

      onUnmount(() => {
        resource.release(); // cleanup-only
      });
    });
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { onBeforeMount, onMount, onUnmount } from "@usels/core";

    function useExample() {
      "use scope"

      onBeforeMount(() => {
        // runs at useLayoutEffect timing — before paint
      });

      onMount(() => {
        const sub = source$.onChange(handler);
        return () => sub(); // cleanup runs on unmount
      });

      onUnmount(() => {
        resource.release(); // cleanup-only
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive subscriptions with `createObserve`

Use `createObserve` from `@usels/core` (not `@legendapp/state`) so subscriptions are automatically registered to the current scope and cleaned up on unmount.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useScope, createObserve } from "@usels/core";

    useScope(() => {
      createObserve(() => {
        // re-runs whenever any accessed observable changes
        // automatically disposed when scope is destroyed
        document.title = title$.get();
      });
    });
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createObserve } from "@usels/core";

    function useTitle() {
      "use scope"

      createObserve(() => {
        // re-runs whenever any accessed observable changes
        // automatically disposed when scope is destroyed
        document.title = title$.get();
      });
    }
    ```

  </Fragment>
</CodeTabs>

### `toObs` hints for non-plain fields

Pass a hints map as the second argument to `toObs` for fields that are functions, opaque objects, or React elements.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useScope, toObs, createObserve } from "@usels/core";

    function useEventHandler(props: { onClick: (e: MouseEvent) => void; data: SomeObject }) {
      return useScope((p) => {
        const obs$ = toObs(p, {
          data: "opaque",      // prevents deep-proxying
        });

        createObserve(() => {
          const handler = obs$.peek()?.onClick;
          element.addEventListener("click", handler);
        });

        return {};
      }, props);
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { toObs, createObserve } from "@usels/core";

    function useEventHandler(props: { onClick: (e: MouseEvent) => void; data: SomeObject }) {
      "use scope"
      const obs$ = toObs(props, {
        data: "opaque",      // prevents deep-proxying
      });

      createObserve(() => {
        const handler = obs$.peek()?.onClick;
        element.addEventListener("click", handler);
      });

      return {};
    }
    ```

  </Fragment>
</CodeTabs>

### React Strict Mode

In development with Strict Mode, React simulates unmount/remount to detect side-effect bugs. The factory may run twice per mount cycle. This is expected and safe — production always runs the factory once.

### `getStore()` inside `useScope`

When a component is rendered inside a `StoreProvider`, `getStore()` works inside a `useScope` factory without any additional setup.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { createStore, observable, createObserve, useScope } from "@usels/core";

    const [, getSettingsStore] = createStore("settings", () => {
      const theme$ = observable<"light" | "dark">("light");
      return { theme$ };
    });

    function useThemeSync() {
      return useScope(() => {
        const { theme$ } = getSettingsStore(); // resolves from nearest StoreProvider

        createObserve(() => {
          document.documentElement.dataset.theme = theme$.get();
        });

        return {};
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createStore, observable, createObserve } from "@usels/core";

    const [, getSettingsStore] = createStore("settings", () => {
      const theme$ = observable<"light" | "dark">("light");
      return { theme$ };
    });

    function useThemeSync() {
      "use scope"
      const { theme$ } = getSettingsStore(); // resolves from nearest StoreProvider

      createObserve(() => {
        document.documentElement.dataset.theme = theme$.get();
      });

      return {};
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { onBeforeMount, onMount, onUnmount } from "./effectScope";
export { createObserve, observe } from "./observe";
export { toObs } from "./reactiveProps";
export type { ReactiveProps } from "./reactiveProps";
export { inject } from "./inject";
type InferBaseFromDeep<T> = Extract<T, ImmutableObservableBase<any>> extends never ? T : Extract<T, ImmutableObservableBase<any>> extends ImmutableObservableBase<infer U> ? U : T;
export declare function useScope<T extends object>(fn: () => T): T;
export declare function useScope<P extends object, T extends object>(fn: (props: ReactiveProps<P>) => T, props: ImmutableObservableBase<P>): T;
export declare function useScope<Props extends object, T extends object>(fn: (props: ReactiveProps<InferBaseFromDeep<Props> & object>) => T, props: Props): T;
export declare function useScope<Params extends [object, object, ...object[]], T extends object>(fn: (...params: {
    [K in keyof Params]: ReactiveProps<InferBaseFromDeep<Params[K]> & object>;
}) => T, ...params: Params): T;
```

## Source

- Implementation: `packages/core/src/primitives/useScope/index.ts`
- Documentation: `packages/core/src/primitives/useScope/index.md`