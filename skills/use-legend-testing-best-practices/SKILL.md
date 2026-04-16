---
name: use-legend-testing-best-practices
description: Use when writing tests for custom hooks or "use scope" components — covers rerender stability, element lifecycle (null→element→null), and reactive options change scenarios
---

# Testing @usels-style Hooks

Three test scenarios consumers should cover for any custom reactive hook. Tooling: `@testing-library/react`'s `renderHook` + `act` + vitest.

## 1. Rerender stability

An unrelated state change must not re-register resources (event listeners, observers, timers).

```tsx
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";

it("does not re-register listener across rerenders", () => {
  const addSpy = vi.spyOn(window, "addEventListener");

  const { rerender } = renderHook(() => {
    const [, setTick] = useState(0);
    const result = useMyHook();
    return { setTick, result };
  });

  const initialCount = addSpy.mock.calls.length;
  act(() => rerender());
  act(() => rerender());

  expect(addSpy.mock.calls.length).toBe(initialCount);
});
```

Check spies for `addEventListener` / `new IntersectionObserver` / `setInterval` — call counts must stay flat.

## 2. Element lifecycle — `null → element → null → element`

For hooks that accept an element target (`MaybeElement`), exercise the full lifecycle and **also** dispatch a real event to confirm the hook still works after re-mount. Spy counts alone can pass even when the hook is broken.

```tsx
import { useRef$ } from "@usels/core";

it("re-registers and still fires after null → element cycle", () => {
  const el$ = useRef$<HTMLDivElement>();
  const { result } = renderHook(() => useMyHook(el$));

  const a = document.createElement("div");
  act(() => el$(a));           // mount
  act(() => el$(null));         // unmount
  const b = document.createElement("div");
  act(() => el$(b));           // remount

  // ✅ functional verification — dispatch real event, assert state
  act(() => b.dispatchEvent(new Event("click")));
  expect(result.current.clickCount$.get()).toBe(1);
});
```

## 3. Reactive options

Passing an `observable(...)` value as an option and mutating it must recreate / update the resource. Assert on the result, not the Observable.

```ts
import { observable } from "@legendapp/state";

it("updates when observable option changes", () => {
  const margin$ = observable("0px");
  const { result } = renderHook(() => useMyHook(target, { rootMargin: margin$ }));

  act(() => margin$.set("20px"));

  // ✅ read the value, compare a plain
  expect(result.current.margin$.get()).toBe("20px");
});
```

## Rule — never pass an Observable directly to `expect(...)`

```ts
// ❌ OOM — Vitest deep-inspects the proxy → infinite recursion
expect(result.current.value$).toBeDefined();
expect(result.current.p$.obs).toBe(source$);

// ✅ call .get() and compare plain values
expect(result.current.value$.get()).toBe(42);

// ✅ identity check — wrap in === and pass the boolean
expect(result.current.p$.obs === source$).toBe(true);
```

This applies to any Legend-State Observable, including child fields accessed via `p$.field`.

## What to skip

For consumer-written hooks, these three scenarios plus standard "does the core behavior work" tests are enough. Browser-only variants (`*.browser.spec.ts`), type-level tests, and edge-case matrices are library-maintainer concerns.
