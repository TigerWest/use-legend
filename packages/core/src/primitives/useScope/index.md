---
title: useScope
category: Primitives
---

Runs a factory function exactly once per mount inside an effect scope. The factory's return value is stable across re-renders. Reactive subscriptions registered inside the factory (via `observe`) are automatically cleaned up on unmount.

## Usage

```tsx twoslash
// @noErrors
import { useScope, onMount, onUnmount, observe } from "@usels/core";
import { observable } from "@legendapp/state";

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

### With props

Pass a second argument to receive reactive props inside the factory. `p.field` always returns the latest value without tracking. Use `toObs(p)` to get a reactive `Observable<P>` that updates when props change.

```tsx
import { useScope, toObs, observe } from "@usels/core";

function useThemeSync(props: { theme: string }) {
  return useScope((p) => {
    // p.theme — raw latest (no reactive tracking)
    // obs$.theme.get() — reactive, triggers re-observation on change
    const obs$ = toObs(p);

    observe(() => {
      document.documentElement.dataset.theme = obs$.theme.get();
    });

    return {};
  }, props);
}
```

### Lifecycle callbacks

| API             | Timing                        | Notes                                    |
| --------------- | ----------------------------- | ---------------------------------------- |
| `onBeforeMount` | `useLayoutEffect` — pre-paint | DOM measurement, scroll position restore |
| `onMount`       | `useEffect` — after mount     | Returns optional cleanup function        |
| `onUnmount`     | component unmount             | Shorthand for `onMount(() => cleanup)`   |

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

### Reactive subscriptions with `observe`

Use `observe` from `@usels/core` (not `@legendapp/state`) so subscriptions are automatically registered to the current scope and cleaned up on unmount.

```tsx
import { useScope, observe } from "@usels/core";

useScope(() => {
  observe(() => {
    // re-runs whenever any accessed observable changes
    // automatically disposed when scope is destroyed
    document.title = title$.get();
  });
});
```

### `toObs` hints for non-plain fields

Pass a hints map as the second argument to `toObs` for fields that are functions, opaque objects, or React elements.

```tsx
import { useScope, toObs, observe } from "@usels/core";

function useEventHandler(props: { onClick: (e: MouseEvent) => void; data: SomeObject }) {
  return useScope((p) => {
    const obs$ = toObs(p, {
      onClick: "function", // stored opaque — access via obs$.peek()?.onClick
      data: "opaque", // prevents deep-proxying
    });

    observe(() => {
      // access function fields via obs$.peek()
      const handler = obs$.peek()?.onClick;
      element.addEventListener("click", handler);
    });

    return {};
  }, props);
}
```

### React Strict Mode

In development with Strict Mode, React simulates unmount/remount to detect side-effect bugs. The factory may run twice per mount cycle. This is expected and safe — production always runs the factory once.

### `getStore()` inside `useScope`

When a component is rendered inside a `StoreProvider`, `getStore()` works inside a `useScope` factory without any additional setup.

```tsx
import { createStore } from "@usels/core";
import { useScope, observe } from "@usels/core";

const [, getSettingsStore] = createStore("settings", () => {
  const theme$ = observable<"light" | "dark">("light");
  return { theme$ };
});

function useThemeSync() {
  return useScope(() => {
    const { theme$ } = getSettingsStore(); // resolves from nearest StoreProvider

    observe(() => {
      document.documentElement.dataset.theme = theme$.get();
    });

    return {};
  });
}
```
