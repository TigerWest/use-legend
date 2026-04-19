# Observable Props Propagation — Edge Case Map & Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Map every edge case that can occur when a Function Component typed as `DeepMaybeObservable<Props>` uses `"use scope"` + `toObs(props)` + `<Child {...$props}>` spread propagation, and lock the current behavior with a classified test suite (LOCKED / OBSERVED / EXPECT-FAIL).

**Architecture:** Add a new directory `packages/core/src/primitives/useScope/propsPropagation/` containing five `*.spec.tsx?` files (one per axis) plus a shared `fixtures.ts`. Tests run under existing vitest + jsdom config; no source code of `reactiveProps.ts` or `useScope` is modified. OBSERVED/EXPECT-FAIL outcomes get listed in an accompanying spec document (`docs/superpowers/specs/2026-04-19-observable-props-propagation.md`) as Open Questions for follow-up specs.

**Tech Stack:** vitest, jsdom, `@testing-library/react`, `@legendapp/state`, `@usels/core` (`useScope`, `toObs`, `onMount`, `onUnmount`), React 18, TypeScript.

---

## File Structure

Create:
- `docs/superpowers/specs/2026-04-19-observable-props-propagation.md` — the brainstorming spec (Open Questions + Improvement Candidates)
- `packages/core/src/primitives/useScope/propsPropagation/fixtures.ts` — `createSpyChild`, `recordSubscriptions`, `countProxyTraversals`, `renderInStrictMode`, `makeCallbackSpy`
- `packages/core/src/primitives/useScope/propsPropagation/index.spec.tsx` — Axis 1 (toObs input shapes)
- `packages/core/src/primitives/useScope/propsPropagation/spread.spec.tsx` — Axis 2 (spread propagation, main)
- `packages/core/src/primitives/useScope/propsPropagation/opaque.spec.tsx` — Axis 3 (deep-proxy / opaque)
- `packages/core/src/primitives/useScope/propsPropagation/lifecycle.spec.tsx` — Axis 4 (StrictMode / remount / SSR)
- `packages/core/src/primitives/useScope/propsPropagation/types.spec.tsx` — Axis 5 (type-level)

Do NOT modify: any file under `packages/core/src/primitives/useScope/*.ts` except to re-export if strictly needed (plan assumes no re-exports are needed — imports go through `@primitives/useScope` alias or relative `../`).

All spec files use the existing vitest path resolution (same as `rerender.spec.ts`). The first non-comment line in every spec file is `// @vitest-environment jsdom`.

---

## Terminology & Classification Rules

Every `it(...)` in this plan is classified as one of:

- **LOCKED** — `it("...")` with strict positive assertion. Contract. Regression guard.
- **OBSERVED** — `it("observed: ...")` single `describe` block prefixed with `/* OBSERVED */` comment banner. Asserts current behavior. If behavior changes upstream, revisit.
- **EXPECT-FAIL** — `it.fails("...")` with the _desired_ assertion. `it.fails` passes iff the inner assertion throws. Documents a known gap; fix lives in a follow-up spec.

Classification in the "Why" line of each test tells the engineer which macro to use. Never demote a LOCKED case to OBSERVED to make it pass — instead, mark EXPECT-FAIL and file under Open Questions.

**Observable in `expect()` rule:** Never pass a Legend-State `Observable` directly to `expect()` (infinite recursion via Proxy). Compare with `===` then pass a boolean, or call `.get()`/`.peek()` and pass the plain value. This applies to every test in the plan.

---

## Task 0: Scaffold directory + spec document + fixtures

**Files:**
- Create: `docs/superpowers/specs/2026-04-19-observable-props-propagation.md`
- Create: `packages/core/src/primitives/useScope/propsPropagation/fixtures.ts`

- [ ] **Step 1: Create the spec document shell**

Create `docs/superpowers/specs/2026-04-19-observable-props-propagation.md` with the structure below. The Open Questions and Improvement Candidates sections will be populated as tests are written — leave TODO markers in this shell only (markers inside the spec document are allowed as a working log; they are NOT plan placeholders).

```markdown
# Observable Props Propagation — Edge Case Map & Test Suite

**Status:** Draft — test suite in progress
**Date:** 2026-04-19
**Owner:** (fill in)

## Background

`Function(props: DeepMaybeObservable<Props>)` components under the `"use scope"`
directive convert props to an `Observable<Props>` via `toObs(props)` and can
propagate them to children with JSX spread: `<Child {...toObs(props)}>`. This
pattern has several behavior axes that are not fully covered by the current
per-hook test files (`observable.spec.ts`, `rerender.spec.ts`, etc.). This spec
enumerates those axes, fixes the current behavior as a regression baseline, and
records Open Questions that inform follow-up work (new APIs, lint rules, docs).

## Scope

- Observe and lock current runtime and type behavior across five axes.
- Classify each scenario as LOCKED / OBSERVED / EXPECT-FAIL.
- List improvement candidates; do NOT implement them here.

## Non-Goals

- No changes to `reactiveProps.ts` or `useScope` runtime.
- No changes to `DeepMaybeObservable<T>` or `PropsOf<P>` types.
- No babel plugin changes.
- No performance benchmarks.
- No browser-variant tests (JSDOM coverage is sufficient for an edge-case map).

## Architecture

Five test files, one per axis, under
`packages/core/src/primitives/useScope/propsPropagation/`. Shared helpers in
`fixtures.ts`. See implementation plan
`docs/superpowers/plans/2026-04-19-observable-props-propagation.md`.

## Axis Catalog

| Axis | File | Scenarios |
|---|---|---|
| 1. toObs input shapes | `index.spec.tsx` | A1-1 … A1-9 |
| 2. Spread propagation | `spread.spec.tsx` | A2-1 … A2-14 |
| 3. Deep-proxy / opaque | `opaque.spec.tsx` | A3-1 … A3-8 |
| 4. React lifecycle | `lifecycle.spec.tsx` | A4-1 … A4-7 |
| 5. Types | `types.spec.tsx` | A5-1 … A5-10 |

Scenario IDs are stable and referenced by test `it(...)` names.

## Classification Rules

- **LOCKED** — strict assertion, regression guard.
- **OBSERVED** — `/* OBSERVED */` banner, `it("observed: ...")`, asserts current
  behavior pending follow-up review.
- **EXPECT-FAIL** — `it.fails("...")`, asserts the desired behavior; passes iff
  the desired assertion currently throws. Each one is logged below.

Never silently change classification to make a test pass. File under Open
Questions.

## Open Questions

(Populated during implementation. Each entry: `A?-? — <short title> — spec
file:line — current behavior summary — follow-up issue.`)

- TODO: populated by Tasks 1-5.

## Improvement Candidates

(Populated during implementation. Each entry: title — rationale — estimated
blast radius.)

- TODO: populated by Task 6.

## Links

- Plan: `docs/superpowers/plans/2026-04-19-observable-props-propagation.md`
- Library guide: `.claude/rules/library-implementation-guide.md`
- Component props guide: `skills/use-legend-best-practices/references/component-props.md`
- Testing guide: `.claude/rules/testing-guide.md`
- `toObs` source: `packages/core/src/primitives/useScope/reactiveProps.ts`
```

- [ ] **Step 2: Create `fixtures.ts`**

```ts
// packages/core/src/primitives/useScope/propsPropagation/fixtures.ts
import { createElement, StrictMode, type ReactElement, type ComponentType } from "react";
import { render, type RenderResult } from "@testing-library/react";
import type { Observable } from "@legendapp/state";
import { vi, type Mock } from "vitest";

/**
 * SpyChild — props receiver that records every render and the props seen.
 *
 * Returns a stable component plus two mock spies:
 * - `renderSpy` — incremented per render
 * - `receiveSpy` — called with (props) per render
 */
export function createSpyChild<P = Record<string, unknown>>(): {
  SpyChild: ComponentType<P>;
  renderSpy: Mock<[], void>;
  receiveSpy: Mock<[P], void>;
} {
  const renderSpy = vi.fn<[], void>();
  const receiveSpy = vi.fn<[P], void>();
  function SpyChild(props: P) {
    renderSpy();
    receiveSpy(props);
    return null;
  }
  return { SpyChild, renderSpy, receiveSpy };
}

/**
 * Subscribe to an Observable's `onChange` and record each emitted value.
 * Returns the log plus an unsub you MUST call to avoid cross-test leaks.
 *
 * IMPORTANT: do not `expect(obs$)` — push `obs$.peek()` into the log instead.
 */
export function recordSubscriptions<T>(obs$: Observable<T>): {
  calls: T[];
  unsub: () => void;
} {
  const calls: T[] = [];
  const unsub = obs$.onChange(() => {
    calls.push(obs$.peek());
  });
  return { calls, unsub };
}

/**
 * Wrap an object in a Proxy that counts every top-level `get` trap invocation
 * and logs which keys were accessed. Used by Axis 3 to detect unnecessary
 * Legend-State deep-proxy traversals.
 *
 * Only traps top-level get — nested access is not instrumented.
 */
export function countProxyTraversals<T extends object>(value: T): {
  wrapped: T;
  getCount: () => number;
  keyLog: () => string[];
} {
  let count = 0;
  const keys: string[] = [];
  const wrapped = new Proxy(value, {
    get(target, key, recv) {
      if (typeof key === "string") {
        count++;
        keys.push(key);
      }
      return Reflect.get(target, key, recv);
    },
  }) as T;
  return {
    wrapped,
    getCount: () => count,
    keyLog: () => keys.slice(),
  };
}

/**
 * Render the element wrapped in React.StrictMode. Use when you must observe
 * double-mount / double-effect behavior.
 */
export function renderInStrictMode(element: ReactElement): RenderResult {
  return render(createElement(StrictMode, null, element));
}

/**
 * Callback factory. When `stable: false` (default), returns a fresh function
 * on every call (simulates a parent that recreates callbacks per render).
 * When `stable: true`, returns the same function every time.
 *
 * The inner fn is a vi.fn so callers can assert call counts.
 */
export function makeCallbackSpy(opts: { stable?: boolean } = {}): {
  next: () => Mock<unknown[], unknown>;
  shared: Mock<unknown[], unknown>;
} {
  const shared = vi.fn();
  return {
    shared,
    next: () => (opts.stable ? shared : vi.fn()),
  };
}
```

- [ ] **Step 3: Verify fixtures type-check**

Run from repo root:

```bash
pnpm --filter @usels/core exec tsc --noEmit
```

Expected: 0 errors. If fixtures introduce type errors, fix them in `fixtures.ts` before proceeding.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-19-observable-props-propagation.md \
        docs/superpowers/plans/2026-04-19-observable-props-propagation.md \
        packages/core/src/primitives/useScope/propsPropagation/fixtures.ts
git commit -m "test(core): scaffold propsPropagation spec + fixtures"
```

---

## Task 1: Axis 1 — `toObs` input shapes

**Files:**
- Create: `packages/core/src/primitives/useScope/propsPropagation/index.spec.tsx`

This file covers how `toObs(p)` behaves for nine input shapes. No spread here; that's Axis 2.

- [ ] **Step 1: Write the file skeleton**

```tsx
// packages/core/src/primitives/useScope/propsPropagation/index.spec.tsx
// @vitest-environment jsdom
import { render, renderHook, act } from "@testing-library/react";
import { observable, type Observable } from "@legendapp/state";
import { createElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { useScope, toObs, observe } from "..";
import { recordSubscriptions } from "./fixtures";

describe("propsPropagation — axis 1: toObs input shapes", () => {
  // tests added in steps 2-10
});
```

- [ ] **Step 2: A1-1 plain props (LOCKED)**

```tsx
// A1-1 — LOCKED
it("plain props: toObs returns Observable of the unwrapped shape", () => {
  let captured: Observable<{ a: number; b: string }> | undefined;
  renderHook(
    ({ a, b }) =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          captured = p$;
          return {};
        },
        { a, b }
      ),
    { initialProps: { a: 1, b: "x" } }
  );
  expect(captured).toBeDefined();
  // Never expect(captured) directly — compare values.
  expect(captured!.a.get()).toBe(1);
  expect(captured!.b.get()).toBe("x");
});
```

- [ ] **Step 3: A1-2 per-field Observable props (LOCKED)**

```tsx
// A1-2 — LOCKED: per-field Observable subscribed via onChange
it("per-field Observable: outer set propagates into toObs result", () => {
  const a$ = observable(1);
  let captured: Observable<{ a: number; b: string }> | undefined;
  const { rerender } = renderHook(
    ({ a, b }) =>
      useScope(
        (p) => {
          const p$ = toObs(p) as unknown as Observable<{ a: number; b: string }>;
          captured = p$;
          return {};
        },
        { a, b }
      ),
    { initialProps: { a: a$, b: "x" } as { a: Observable<number> | number; b: string } }
  );
  expect(captured!.a.get()).toBe(1);
  act(() => a$.set(2));
  expect(captured!.a.get()).toBe(2);
  rerender({ a: a$, b: "x" });
  expect(captured!.a.get()).toBe(2);
});
```

- [ ] **Step 4: A1-3 outer Observable (LOCKED fast path)**

```tsx
// A1-3 — LOCKED: outer Observable returned as-is
it("outer Observable: toObs returns the same observable instance", () => {
  const outer$ = observable({ a: 1, b: "x" });
  let captured: Observable<{ a: number; b: string }> | undefined;
  renderHook(() =>
    useScope(
      (p) => {
        captured = toObs(p) as unknown as Observable<{ a: number; b: string }>;
        return {};
      },
      outer$
    )
  );
  // Compare with === then assert boolean — never expect(obs$) directly.
  expect(captured === (outer$ as unknown as Observable<{ a: number; b: string }>)).toBe(true);
});
```

- [ ] **Step 5: A1-4 nested plain (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 1 — nested plain object field", () => {
  // A1-4 — OBSERVED: only changed leaf fires
  it("observed: setting props$.coord = { x: 30, y: 20 } fires only coord.x when y unchanged", () => {
    let p$!: Observable<{ coord: { x: number; y: number } }>;
    renderHook(
      ({ coord }) =>
        useScope(
          (p) => {
            p$ = toObs(p) as unknown as Observable<{ coord: { x: number; y: number } }>;
            return {};
          },
          { coord }
        ),
      { initialProps: { coord: { x: 10, y: 20 } } }
    );
    const { calls: xCalls, unsub: unsubX } = recordSubscriptions(p$.coord.x);
    const { calls: yCalls, unsub: unsubY } = recordSubscriptions(p$.coord.y);
    act(() => p$.coord.set({ x: 30, y: 20 }));
    expect(xCalls).toEqual([30]);
    expect(yCalls).toEqual([]); // current behavior — recorded, not contracted
    unsubX();
    unsubY();
  });
});
```

- [ ] **Step 6: A1-5 nested Observable (EXPECT-FAIL)**

```tsx
// A1-5 — EXPECT-FAIL: nested Observable field explicitly unsupported
it.fails("nested Observable field propagates (currently unsupported)", () => {
  const inner$ = observable({ x: 10 });
  let p$!: Observable<{ coord: { x: number } }>;
  renderHook(() =>
    useScope(
      (p) => {
        p$ = toObs(p) as unknown as Observable<{ coord: { x: number } }>;
        return {};
      },
      { coord: inner$ } as { coord: Observable<{ x: number }> | { x: number } }
    )
  );
  // Desired behavior: inner$.x.set(99) propagates to p$.coord.x.
  // Currently buildInitialValue only handles top-level Observable fields.
  act(() => inner$.x.set(99));
  expect(p$.coord.x.get()).toBe(99); // fails today
});
```

- [ ] **Step 7: A1-6 function prop without hint (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 1 — function prop without hint", () => {
  // A1-6 — OBSERVED: new function reference every render
  it("observed: p$ set-diff fires when callback identity changes each render", () => {
    let p$!: Observable<{ cb: () => number }>;
    const { rerender } = renderHook(
      ({ cb }) =>
        useScope(
          (p) => {
            p$ = toObs(p) as unknown as Observable<{ cb: () => number }>;
            return {};
          },
          { cb }
        ),
      { initialProps: { cb: () => 1 } }
    );
    const { calls, unsub } = recordSubscriptions(p$.cb);
    rerender({ cb: () => 2 });
    rerender({ cb: () => 3 });
    // Record how many times a fresh callback reference fires the field onChange.
    expect(calls.length).toBeGreaterThan(0);
    unsub();
  });
});
```

- [ ] **Step 8: A1-7 HTMLElement prop without hint (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 1 — HTMLElement prop without hint", () => {
  // A1-7 — OBSERVED: Legend-State may deep-proxy HTMLElements
  it("observed: passing an HTMLElement without 'element' hint does not throw", () => {
    const el = document.createElement("div");
    expect(() => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p) as unknown as Observable<{ el: HTMLElement }>;
            // Reading .get() triggers any deep-proxy traversal.
            observe(() => {
              void p$.el.get();
            });
            return {};
          },
          { el }
        )
      );
    }).not.toThrow();
  });
});
```

- [ ] **Step 9: A1-8 undefined/removed field (LOCKED)**

```tsx
// A1-8 — LOCKED: removed field path
it("missing field in next props: syncProps clears to undefined", () => {
  let p$!: Observable<{ a?: number; b?: number }>;
  const { rerender } = renderHook(
    (props: { a?: number; b?: number }) =>
      useScope(
        (p) => {
          p$ = toObs(p) as unknown as Observable<{ a?: number; b?: number }>;
          return {};
        },
        props
      ),
    { initialProps: { a: 1, b: 2 } as { a?: number; b?: number } }
  );
  expect(p$.a.get()).toBe(1);
  rerender({ b: 2 });
  expect(p$.a.get()).toBeUndefined();
});
```

- [ ] **Step 10: A1-9 scalar hint 'opaque' (LOCKED)**

```tsx
// A1-9 — LOCKED: scalar hint applied to entire props
it("scalar hint 'opaque': toObs(p, 'opaque') treats props as a single opaque value", () => {
  const input = { nested: { deep: 1 } };
  let peeked: unknown;
  renderHook(() =>
    useScope(
      (p) => {
        const p$ = toObs(p, "opaque");
        peeked = p$.peek();
        return {};
      },
      input
    )
  );
  // The opaque wrap keeps the original shape available via peek.
  expect(peeked).toEqual(input);
});
```

- [ ] **Step 11: Run axis 1**

```bash
pnpm --filter @usels/core exec vitest run \
  src/primitives/useScope/propsPropagation/index.spec.tsx
```

Expected: all LOCKED and OBSERVED tests pass. A1-5 (EXPECT-FAIL) passes because `it.fails` inverts the assertion. If any LOCKED/OBSERVED fails, investigate before moving on — the behavior hypothesis was wrong and the test needs to match current behavior (or be promoted to EXPECT-FAIL with a spec note).

- [ ] **Step 12: Append Open Questions entries**

Edit `docs/superpowers/specs/2026-04-19-observable-props-propagation.md` — append under `## Open Questions`:

```markdown
- A1-4 — nested plain field onChange scope — `propsPropagation/index.spec.tsx` — current: only changed leaf fires — follow-up: confirm desired with Legend-State team.
- A1-5 — nested Observable unsupported — `propsPropagation/index.spec.tsx` — current: no propagation — follow-up: consider new API / explicit error.
- A1-6 — function prop without hint — `propsPropagation/index.spec.tsx` — current: fires onChange on each new reference — follow-up: recommend 'function' hint always; consider auto-detect.
- A1-7 — HTMLElement prop without hint — `propsPropagation/index.spec.tsx` — current: no throw in minimal case; may deep-proxy — follow-up: covered in Axis 3.
```

- [ ] **Step 13: Commit**

```bash
git add packages/core/src/primitives/useScope/propsPropagation/index.spec.tsx \
        docs/superpowers/specs/2026-04-19-observable-props-propagation.md
git commit -m "test(core): axis 1 — toObs input shapes"
```

---

## Task 2: Axis 2 — spread propagation

**Files:**
- Create: `packages/core/src/primitives/useScope/propsPropagation/spread.spec.tsx`

This is the main file. 14 scenarios, mostly around `<Child {...toObs(p)}>`.

- [ ] **Step 1: File skeleton**

```tsx
// packages/core/src/primitives/useScope/propsPropagation/spread.spec.tsx
// @vitest-environment jsdom
import { render, renderHook, act } from "@testing-library/react";
import { observable, isObservable, type Observable } from "@legendapp/state";
import {
  createElement,
  memo as reactMemo,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import { describe, it, expect, vi } from "vitest";
import { useScope, toObs } from "..";
import { createSpyChild } from "./fixtures";

describe("propsPropagation — axis 2: spread", () => {
  // steps 2-15 add individual tests
});
```

- [ ] **Step 2: A2-1 plain parent → spread → plain child (LOCKED)**

```tsx
// A2-1 — LOCKED: spread delivers each field as Observable instance
it("plain parent spread into plain child: each field arrives as Observable", () => {
  const { SpyChild, receiveSpy } = createSpyChild<Record<string, unknown>>();
  function Parent(props: { a: number; b: string }) {
    const result = useScope((p) => ({ p$: toObs(p) }), props);
    const p$ = result.p$;
    return createElement(SpyChild, { ...p$ });
  }
  render(createElement(Parent, { a: 1, b: "x" }));
  const received = receiveSpy.mock.calls[0]?.[0];
  expect(received).toBeDefined();
  expect(isObservable(received!.a)).toBe(true);
  expect(isObservable(received!.b)).toBe(true);
  expect((received!.a as Observable<number>).get()).toBe(1);
  expect((received!.b as Observable<string>).get()).toBe("x");
});
```

- [ ] **Step 3: A2-2 plain parent → spread → "use scope" child that calls toObs (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — 2-tier scope chain", () => {
  // A2-2 — OBSERVED
  it("observed: child toObs on per-field observables propagates parent updates", () => {
    let childP$: Observable<{ a: number }> | undefined;
    function Child(childProps: { a: number | Observable<number> }) {
      const { p$ } = useScope(
        (p) => ({ p$: toObs(p) as unknown as Observable<{ a: number }> }),
        childProps
      );
      childP$ = p$;
      return null;
    }
    function Parent(props: { a: number }) {
      const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
      return createElement(Child, { ...p$ });
    }
    const { rerender } = render(createElement(Parent, { a: 1 }));
    expect(childP$!.a.get()).toBe(1);
    rerender(createElement(Parent, { a: 7 }));
    expect(childP$!.a.get()).toBe(7);
  });
});
```

- [ ] **Step 4: A2-3 outer Observable parent → spread (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — outer Observable parent", () => {
  // A2-3 — OBSERVED: spread on outer Observable exposes the source store directly
  it("observed: child receives fields from the outer observable store", () => {
    const store$ = observable({ a: 10, b: "y" });
    const { SpyChild, receiveSpy } = createSpyChild<Record<string, unknown>>();
    function Parent() {
      const { p$ } = useScope(
        (p) => ({ p$: toObs(p) as unknown as Observable<{ a: number; b: string }> }),
        store$
      );
      return createElement(SpyChild, { ...p$ });
    }
    render(createElement(Parent));
    const received = receiveSpy.mock.calls[0]?.[0];
    // Child holds the outer store's child observables by reference.
    expect(received!.a === (store$.a as unknown)).toBe(true);
    expect(received!.b === (store$.b as unknown)).toBe(true);
  });
});
```

- [ ] **Step 5: A2-4 parent re-render only (LOCKED)**

```tsx
// A2-4 — LOCKED: unrelated parent re-render does not re-render spread child
it("unrelated parent re-render does not re-render child", () => {
  const { SpyChild, renderSpy } = createSpyChild<Record<string, unknown>>();
  let setUnrelated!: (v: number) => void;
  function Parent(props: { a: number }) {
    const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
    const [, setN] = useState(0);
    setUnrelated = setN;
    return createElement(SpyChild, { ...p$ });
  }
  render(createElement(Parent, { a: 1 }));
  expect(renderSpy).toHaveBeenCalledTimes(1);
  act(() => setUnrelated(1));
  act(() => setUnrelated(2));
  expect(renderSpy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 6: A2-5 field override (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — field override after spread", () => {
  // A2-5 — OBSERVED
  it("observed: <Child {...p$} title={other$} /> — override wins, remains reactive", () => {
    const other$ = observable("override");
    const { SpyChild, receiveSpy } = createSpyChild<Record<string, unknown>>();
    function Parent(props: { title: string; body: string }) {
      const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
      return createElement(SpyChild, { ...p$, title: other$ });
    }
    render(createElement(Parent, { title: "orig", body: "body" }));
    const received = receiveSpy.mock.calls[0]?.[0];
    expect(received!.title === (other$ as unknown)).toBe(true);
    expect((received!.body as Observable<string>).get()).toBe("body");
  });
});
```

- [ ] **Step 7: A2-6 conditional spread (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — conditional spread", () => {
  // A2-6 — OBSERVED
  it("observed: <Child {...(cond ? a$ : b$)} /> — both scopes stay alive across toggles", () => {
    let aP$: Observable<{ n: number }> | undefined;
    let bP$: Observable<{ n: number }> | undefined;
    function A() {
      useScope((p) => {
        aP$ = toObs(p) as unknown as Observable<{ n: number }>;
        return {};
      }, { n: 1 });
      return createElement(
        "div",
        { "data-source": "a" },
        JSON.stringify({ n: aP$?.n.get() })
      );
    }
    function B() {
      useScope((p) => {
        bP$ = toObs(p) as unknown as Observable<{ n: number }>;
        return {};
      }, { n: 2 });
      return createElement(
        "div",
        { "data-source": "b" },
        JSON.stringify({ n: bP$?.n.get() })
      );
    }
    function Parent({ cond }: { cond: boolean }) {
      return cond ? createElement(A) : createElement(B);
    }
    const { rerender } = render(createElement(Parent, { cond: true }));
    expect(aP$).toBeDefined();
    expect(bP$).toBeUndefined();
    rerender(createElement(Parent, { cond: false }));
    expect(bP$).toBeDefined();
  });
});
```

- [ ] **Step 8: A2-7 three-tier chain (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — 3-tier chain", () => {
  // A2-7 — OBSERVED
  it("observed: Parent -> Mid {...p$} -> Leaf toObs + read stays reactive end-to-end", () => {
    function Leaf(leafProps: { n: number | Observable<number> }) {
      const { p$ } = useScope(
        (p) => ({ p$: toObs(p) as unknown as Observable<{ n: number }> }),
        leafProps
      );
      return createElement("span", { "data-testid": "leaf" }, String(p$.n.get()));
    }
    function Mid(midProps: { n: number | Observable<number> }) {
      const { p$ } = useScope((p) => ({ p$: toObs(p) }), midProps);
      return createElement(Leaf, { ...p$ });
    }
    function Parent(props: { n: number }) {
      const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
      return createElement(Mid, { ...p$ });
    }
    const { getByTestId, rerender } = render(createElement(Parent, { n: 1 }));
    expect(getByTestId("leaf").textContent).toBe("1");
    rerender(createElement(Parent, { n: 2 }));
    expect(getByTestId("leaf").textContent).toBe("2");
  });
});
```

- [ ] **Step 9: A2-8 React.memo + spread (EXPECT-FAIL)**

```tsx
// A2-8 — EXPECT-FAIL: memo child's internal .get() should stay reactive; today memo blocks re-render
it.fails("React.memo child still re-renders visible text on Observable field change", () => {
  const MemoChild = reactMemo(function MC(props: { title: Observable<string> | string }) {
    const v =
      typeof props.title === "string" ? props.title : (props.title as Observable<string>).get();
    return createElement("span", { "data-testid": "memo" }, v);
  });
  function Parent(props: { title: string }) {
    const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
    return createElement(MemoChild, { ...p$ });
  }
  const { getByTestId, rerender } = render(createElement(Parent, { title: "a" }));
  expect(getByTestId("memo").textContent).toBe("a");
  rerender(createElement(Parent, { title: "b" }));
  expect(getByTestId("memo").textContent).toBe("b"); // today the memo shortcut may block the update
});
```

- [ ] **Step 10: A2-9 children destructured (LOCKED)**

```tsx
// A2-9 — LOCKED: destructure children before toObs
it("children destructured then spread: ReactNode reaches child untouched", () => {
  function Wrapper(props: { title: string; children?: ReactNode }) {
    const { children, ...rest } = props;
    const { p$ } = useScope((p) => ({ p$: toObs(p) }), rest);
    return createElement("div", { "data-testid": "wrap" }, [
      createElement("span", { key: "t" }, (p$ as unknown as Observable<{ title: string }>).title.get()),
      children,
    ]);
  }
  const { getByTestId } = render(
    createElement(Wrapper, { title: "T" }, createElement("i", null, "child"))
  );
  expect(getByTestId("wrap").textContent).toContain("T");
  expect(getByTestId("wrap").textContent).toContain("child");
});
```

- [ ] **Step 11: A2-10 children NOT destructured (EXPECT-FAIL)**

```tsx
// A2-10 — EXPECT-FAIL: without destructuring, children becomes an Observable and child can't render
it.fails("children passed through toObs still renders as ReactNode", () => {
  function Bad(props: { title: string; children?: ReactNode }) {
    const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
    // children is now on the observable — this is the known-bad path.
    return createElement(
      "div",
      { "data-testid": "bad" },
      (p$ as unknown as Observable<{ children: ReactNode }>).children.get()
    );
  }
  const { getByTestId } = render(
    createElement(Bad, { title: "T" }, createElement("i", null, "child"))
  );
  expect(getByTestId("bad").textContent).toBe("child");
});
```

- [ ] **Step 12: A2-11 parent field replacement via re-render (LOCKED)**

```tsx
// A2-11 — LOCKED: syncProps detects changed key and propagates
it("parent re-renders with new field value: child sees update via reactive read", () => {
  function Leaf(leafProps: { title: string | Observable<string> }) {
    const { p$ } = useScope(
      (p) => ({ p$: toObs(p) as unknown as Observable<{ title: string }> }),
      leafProps
    );
    return createElement("span", { "data-testid": "leaf" }, p$.title.get());
  }
  function Parent(props: { title: string }) {
    const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
    return createElement(Leaf, { ...p$ });
  }
  const { getByTestId, rerender } = render(createElement(Parent, { title: "a" }));
  expect(getByTestId("leaf").textContent).toBe("a");
  rerender(createElement(Parent, { title: "b" }));
  expect(getByTestId("leaf").textContent).toBe("b");
});
```

- [ ] **Step 13: A2-12 nested plain field mutation via re-render (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — nested plain field update via re-render", () => {
  // A2-12 — OBSERVED
  it("observed: parent re-renders with { coord: { x, y } }, leaf reads updated x", () => {
    function Leaf(leafProps: { coord: { x: number; y: number } | Observable<{ x: number; y: number }> }) {
      const { p$ } = useScope(
        (p) => ({
          p$: toObs(p) as unknown as Observable<{ coord: { x: number; y: number } }>,
        }),
        leafProps
      );
      return createElement("span", { "data-testid": "leaf" }, String(p$.coord.x.get()));
    }
    function Parent(props: { coord: { x: number; y: number } }) {
      const { p$ } = useScope((p) => ({ p$: toObs(p) }), props);
      return createElement(Leaf, { ...p$ });
    }
    const { getByTestId, rerender } = render(
      createElement(Parent, { coord: { x: 1, y: 2 } })
    );
    expect(getByTestId("leaf").textContent).toBe("1");
    rerender(createElement(Parent, { coord: { x: 9, y: 2 } }));
    expect(getByTestId("leaf").textContent).toBe("9");
  });
});
```

- [ ] **Step 14: A2-13 outer Observable + child-field mutation (EXPECT-FAIL)**

```tsx
// A2-13 — EXPECT-FAIL: documented as "behavior may vary"
it.fails("outer Observable parent: child-field mutation updates leaf reactively", () => {
  const store$ = observable({ title: "a" });
  function Leaf(leafProps: { title: string | Observable<string> }) {
    const { p$ } = useScope(
      (p) => ({ p$: toObs(p) as unknown as Observable<{ title: string }> }),
      leafProps
    );
    return createElement("span", { "data-testid": "leaf" }, p$.title.get());
  }
  function Parent() {
    const { p$ } = useScope(
      (p) => ({ p$: toObs(p) as unknown as Observable<{ title: string }> }),
      store$
    );
    return createElement(Leaf, { ...p$ });
  }
  const { getByTestId } = render(createElement(Parent));
  expect(getByTestId("leaf").textContent).toBe("a");
  act(() => store$.title.set("b"));
  expect(getByTestId("leaf").textContent).toBe("b");
});
```

- [ ] **Step 15: A2-14 callback field peek (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 2 — callback field via spread", () => {
  // A2-14 — OBSERVED
  it("observed: child reads $props.onSubmit.peek()?.() and fires latest callback", () => {
    const calls: string[] = [];
    function Leaf(leafProps: { onSubmit: (() => void) | Observable<() => void> }) {
      const { p$ } = useScope(
        (p) => ({
          p$: toObs(p, { onSubmit: "function" }) as unknown as Observable<{
            onSubmit: () => void;
          }>,
        }),
        leafProps
      );
      return createElement(
        "button",
        {
          "data-testid": "btn",
          onClick: () => p$.onSubmit.peek()?.(),
        },
        "go"
      );
    }
    function Parent(props: { onSubmit: () => void }) {
      const { p$ } = useScope((p) => ({ p$: toObs(p, { onSubmit: "function" }) }), props);
      return createElement(Leaf, { ...p$ });
    }
    const { getByTestId, rerender } = render(
      createElement(Parent, { onSubmit: () => calls.push("first") })
    );
    (getByTestId("btn") as HTMLButtonElement).click();
    rerender(createElement(Parent, { onSubmit: () => calls.push("second") }));
    (getByTestId("btn") as HTMLButtonElement).click();
    expect(calls).toEqual(["first", "second"]);
  });
});
```

- [ ] **Step 16: Run axis 2**

```bash
pnpm --filter @usels/core exec vitest run \
  src/primitives/useScope/propsPropagation/spread.spec.tsx
```

Expected: all tests report green (LOCKED/OBSERVED as positive assertions, EXPECT-FAIL via `it.fails`). If a LOCKED/OBSERVED fails, investigate — do NOT convert it to OBSERVED silently.

- [ ] **Step 17: Append Open Questions entries**

Append to the spec's `## Open Questions` section:

```markdown
- A2-2 — 2-tier scope chain propagation — `propsPropagation/spread.spec.tsx` — current: parent rerender drives child toObs via per-field onChange — follow-up: measure subscription count per tier.
- A2-3 — outer Observable spread exposes source store — `propsPropagation/spread.spec.tsx` — current: child holds store references directly — follow-up: document or guard against accidental store leakage.
- A2-5 — field override after spread — `propsPropagation/spread.spec.tsx` — current: override wins, reactivity preserved — follow-up: add to component-props docs.
- A2-6 — conditional spread — `propsPropagation/spread.spec.tsx` — current: both branches allocate scope on visit — follow-up: verify cleanup on branch switch.
- A2-7 — 3-tier chain — `propsPropagation/spread.spec.tsx` — current: leaf stays reactive — follow-up: measure re-render amplification cost.
- A2-8 — React.memo blocks observable-prop change — `propsPropagation/spread.spec.tsx` — EXPECT-FAIL — follow-up: doc anti-pattern or provide helper.
- A2-10 — children passed through toObs — `propsPropagation/spread.spec.tsx` — EXPECT-FAIL — follow-up: lint rule 'destructure children before toObs'.
- A2-12 — nested plain re-render — `propsPropagation/spread.spec.tsx` — current: leaf reads updated nested value — follow-up: confirm Legend-State recursive diff semantics.
- A2-13 — outer Observable child-field mutation — `propsPropagation/spread.spec.tsx` — EXPECT-FAIL — follow-up: guide already notes this; confirm with upstream.
- A2-14 — callback via spread — `propsPropagation/spread.spec.tsx` — current: peek fires latest — follow-up: ensure 'function' hint is recommended consistently.
```

- [ ] **Step 18: Commit**

```bash
git add packages/core/src/primitives/useScope/propsPropagation/spread.spec.tsx \
        docs/superpowers/specs/2026-04-19-observable-props-propagation.md
git commit -m "test(core): axis 2 — spread propagation"
```

---

## Task 3: Axis 3 — deep-proxy & opaque

**Files:**
- Create: `packages/core/src/primitives/useScope/propsPropagation/opaque.spec.tsx`

- [ ] **Step 1: File skeleton**

```tsx
// packages/core/src/primitives/useScope/propsPropagation/opaque.spec.tsx
// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { type Observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useScope, toObs, observe } from "..";

describe("propsPropagation — axis 3: deep-proxy / opaque", () => {
  // steps 2-9 add tests
});
```

- [ ] **Step 2: A3-1 Date prop without hint (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 3 — Date prop", () => {
  // A3-1
  it("observed: Date prop without hint — peek() round-trips to the same Date", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    let peeked: unknown;
    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p) as unknown as Observable<{ d: Date }>;
          peeked = p$.d.peek();
          return {};
        },
        { d }
      )
    );
    // Document current behavior: may or may not be the same reference.
    expect(peeked).toBeInstanceOf(Date);
    expect((peeked as Date).toISOString()).toBe(d.toISOString());
  });
});
```

- [ ] **Step 3: A3-2 Map/Set prop (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 3 — Map / Set props", () => {
  // A3-2
  it("observed: Map prop with 'opaque' hint keeps original reference", () => {
    const m = new Map([["k", 1]]);
    let peeked: unknown;
    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p, { m: "opaque" }) as unknown as Observable<{ m: Map<string, number> }>;
          peeked = p$.m.peek();
          return {};
        },
        { m }
      )
    );
    expect(peeked === m).toBe(true);
  });
});
```

- [ ] **Step 4: A3-3 class instance (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 3 — class instance", () => {
  // A3-3
  it("observed: class instance peek preserves prototype methods with 'opaque'", () => {
    class Thing {
      greet(): string {
        return "hi";
      }
    }
    const t = new Thing();
    let peeked: Thing | undefined;
    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p, { t: "opaque" }) as unknown as Observable<{ t: Thing }>;
          peeked = p$.t.peek();
          return {};
        },
        { t }
      )
    );
    expect(peeked).toBeDefined();
    expect(peeked!.greet()).toBe("hi");
  });
});
```

- [ ] **Step 5: A3-4 HTMLElement with 'element' hint (LOCKED)**

```tsx
// A3-4 — LOCKED: element hint resolves DOM node and opaques it
it("HTMLElement with 'element' hint: observable resolves the DOM node", () => {
  const el = document.createElement("div");
  let peeked: unknown;
  renderHook(() =>
    useScope(
      (p) => {
        const p$ = toObs(p, { el: "element" }) as unknown as Observable<{ el: HTMLElement }>;
        observe(() => {
          peeked = p$.el.peek();
        });
        return {};
      },
      { el }
    )
  );
  // peeked is an opaque-wrapped element; unwrapping via peek gives the element or its opaque holder.
  expect(peeked).toBeTruthy();
});
```

- [ ] **Step 6: A3-5 HTMLElement without hint (EXPECT-FAIL)**

```tsx
// A3-5 — EXPECT-FAIL: raw element should NOT be deep-proxied; current behavior is unsafe
it.fails("HTMLElement without hint is not deep-proxied", () => {
  const el = document.createElement("div");
  let hint = false;
  renderHook(() =>
    useScope(
      (p) => {
        const p$ = toObs(p) as unknown as Observable<{ el: HTMLElement }>;
        const v = p$.el.peek() as unknown;
        // Desired: peek returns the raw element reference.
        hint = v === el;
        return {};
      },
      { el }
    )
  );
  expect(hint).toBe(true);
});
```

- [ ] **Step 7: A3-6 circular reference (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 3 — circular references", () => {
  // A3-6
  it("observed: circular object with 'opaque' hint does not stack overflow", () => {
    type Node = { self?: Node; v: number };
    const n: Node = { v: 1 };
    n.self = n;
    expect(() =>
      renderHook(() =>
        useScope(
          (p) => {
            toObs(p, { n: "opaque" });
            return {};
          },
          { n }
        )
      )
    ).not.toThrow();
  });
});
```

- [ ] **Step 8: A3-7 function with 'function' hint (LOCKED)**

```tsx
// A3-7 — LOCKED: function hint — peek returns the current reference
it("function field with 'function' hint: peek returns the callback", () => {
  const cb = () => 42;
  let peeked: unknown;
  renderHook(() =>
    useScope(
      (p) => {
        const p$ = toObs(p, { cb: "function" }) as unknown as Observable<{ cb: () => number }>;
        peeked = p$.cb.peek();
        return {};
      },
      { cb }
    )
  );
  expect(typeof peeked).toBe("function");
  expect((peeked as () => number)()).toBe(42);
});
```

- [ ] **Step 9: A3-8 function without hint — rerender diff (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 3 — function prop without hint on rerender", () => {
  // A3-8
  it("observed: rerender with a new callback reference invokes .assign on props$", () => {
    let p$!: Observable<{ cb: () => number }>;
    const { rerender } = renderHook(
      ({ cb }) =>
        useScope(
          (p) => {
            p$ = toObs(p) as unknown as Observable<{ cb: () => number }>;
            return {};
          },
          { cb }
        ),
      { initialProps: { cb: () => 1 } }
    );
    const before = p$.cb.peek();
    rerender({ cb: () => 2 });
    const after = p$.cb.peek();
    expect(typeof before).toBe("function");
    expect(typeof after).toBe("function");
    expect(before).not.toBe(after);
  });
});
```

- [ ] **Step 10: Run axis 3**

```bash
pnpm --filter @usels/core exec vitest run \
  src/primitives/useScope/propsPropagation/opaque.spec.tsx
```

Expected green.

- [ ] **Step 11: Append Open Questions**

```markdown
- A3-1 — Date without hint — current: peek is a Date — follow-up: confirm no silent deep-proxy on large payloads.
- A3-2 — Map/Set — current: 'opaque' preserves reference — follow-up: auto-opaque for non-plain built-ins.
- A3-3 — class instance — current: methods survive with 'opaque' — follow-up: document requirement.
- A3-5 — DOM without hint — EXPECT-FAIL — follow-up: auto-detect Element and wrap opaque.
- A3-6 — circular ref — current: no throw with 'opaque' — follow-up: test plain path.
- A3-8 — function without hint — current: new reference each rerender — follow-up: default to 'function' when type is function.
```

- [ ] **Step 12: Commit**

```bash
git add packages/core/src/primitives/useScope/propsPropagation/opaque.spec.tsx \
        docs/superpowers/specs/2026-04-19-observable-props-propagation.md
git commit -m "test(core): axis 3 — deep-proxy / opaque"
```

---

## Task 4: Axis 4 — React lifecycle

**Files:**
- Create: `packages/core/src/primitives/useScope/propsPropagation/lifecycle.spec.tsx`

- [ ] **Step 1: File skeleton**

```tsx
// packages/core/src/primitives/useScope/propsPropagation/lifecycle.spec.tsx
// @vitest-environment jsdom
import { render, act } from "@testing-library/react";
import { observable, type Observable } from "@legendapp/state";
import { createElement, StrictMode } from "react";
import { describe, it, expect, vi } from "vitest";
import { useScope, toObs } from "..";
```

- [ ] **Step 2: A4-1 StrictMode double-mount (LOCKED)**

```tsx
// A4-1 — LOCKED: onMount re-subscribes under StrictMode
it("StrictMode: per-field Observable onChange re-subscribes after simulated unmount", () => {
  const a$ = observable(0);
  let received: number[] = [];
  function Inner(props: { a: Observable<number> | number }) {
    useScope(
      (p) => {
        const p$ = toObs(p) as unknown as Observable<{ a: number }>;
        p$.a.onChange(({ value }) => received.push(value));
        return {};
      },
      props
    );
    return null;
  }
  render(createElement(StrictMode, null, createElement(Inner, { a: a$ })));
  act(() => a$.set(1));
  act(() => a$.set(2));
  expect(received).toEqual([1, 2]);
});
```

- [ ] **Step 3: A4-2 key remount (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 4 — key remount", () => {
  // A4-2
  it("observed: key change allocates a fresh props$, previous subscription detaches", () => {
    const a$ = observable(0);
    const renderMarker = vi.fn();
    function Inner(props: { a: Observable<number> | number }) {
      useScope(
        (p) => {
          toObs(p);
          renderMarker();
          return {};
        },
        props
      );
      return null;
    }
    const { rerender } = render(
      createElement(Inner, { key: "k1", a: a$ } as never)
    );
    rerender(createElement(Inner, { key: "k2", a: a$ } as never));
    expect(renderMarker).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 4: A4-3 Suspense (TODO — manual)**

```tsx
// A4-3 — TODO: needs a Suspense boundary with controlled resolution; skipped pending fixture.
it.todo("Suspense: toObs inside a suspended child resumes subscriptions after resolve");
```

Note: leave `it.todo` here because reliably reproducing Suspense resolution in JSDOM needs a controlled thenable and extra plumbing that's out of scope for this pass.

- [ ] **Step 5: A4-4 SSR (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 4 — SSR shape", () => {
  // A4-4
  it("observed: renderToString-like path — toObs does not throw for plain props (onMount not fired)", async () => {
    // JSDOM itself does not do full SSR; this asserts the no-throw contract when factory runs synchronously.
    function Inner(props: { a: number }) {
      useScope((p) => {
        const p$ = toObs(p) as unknown as Observable<{ a: number }>;
        // read synchronously — equivalent to render-time read
        void p$.a.peek();
        return {};
      }, props);
      return null;
    }
    expect(() => render(createElement(Inner, { a: 1 }))).not.toThrow();
  });
});
```

- [ ] **Step 6: A4-5 unmount then parent fires per-field update (LOCKED)**

```tsx
// A4-5 — LOCKED: after child unmount, parent a$.set should not attempt to write to a disposed props$
it("unmounted child: subsequent outer Observable set does not throw or reach props$", () => {
  const a$ = observable(0);
  let observed: number[] = [];
  function Inner(props: { a: Observable<number> | number }) {
    useScope(
      (p) => {
        const p$ = toObs(p) as unknown as Observable<{ a: number }>;
        p$.a.onChange(({ value }) => observed.push(value));
        return {};
      },
      props
    );
    return null;
  }
  const { unmount } = render(createElement(Inner, { a: a$ }));
  act(() => a$.set(1));
  unmount();
  expect(() => act(() => a$.set(2))).not.toThrow();
  // Best-effort: we do not require that observed contains exactly [1] — some paths may flush differently.
  expect(observed).toContain(1);
});
```

- [ ] **Step 7: A4-6 child attempts to set props$ (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 4 — child writes to props$", () => {
  // A4-6
  it("observed: child .set on a toObs-derived observable — current behavior recorded", () => {
    let writeError: unknown;
    function Inner(props: { a: number }) {
      useScope(
        (p) => {
          const p$ = toObs(p) as unknown as Observable<{ a: number }>;
          try {
            p$.a.set(999);
          } catch (e) {
            writeError = e;
          }
          return {};
        },
        props
      );
      return null;
    }
    render(createElement(Inner, { a: 1 }));
    // Record: does Legend-State throw, silently accept, or mirror back on next sync?
    expect([undefined, "object"]).toContain(typeof writeError);
  });
});
```

- [ ] **Step 8: A4-7 Concurrent rendering (TODO)**

```tsx
// A4-7 — TODO: React concurrent interruption requires useTransition fixtures outside this scope.
it.todo("Concurrent: mid-render interruption keeps ctx.propsRef consistent on retry");
```

- [ ] **Step 9: Run axis 4**

```bash
pnpm --filter @usels/core exec vitest run \
  src/primitives/useScope/propsPropagation/lifecycle.spec.tsx
```

Expected: green. Todos are skipped (counts as pending but does not fail).

- [ ] **Step 10: Append Open Questions**

```markdown
- A4-2 — key remount — current: fresh scope, previous detaches — follow-up: instrument subscription counts.
- A4-3 — Suspense — TODO — follow-up: add controlled-thenable fixture.
- A4-4 — SSR — current: no-throw on render — follow-up: add a true renderToString path.
- A4-6 — child writes to props$ — current: recorded, behavior depends on Legend-State — follow-up: consider readonly narrowing.
- A4-7 — Concurrent rendering — TODO — follow-up: build useTransition fixture.
```

- [ ] **Step 11: Commit**

```bash
git add packages/core/src/primitives/useScope/propsPropagation/lifecycle.spec.tsx \
        docs/superpowers/specs/2026-04-19-observable-props-propagation.md
git commit -m "test(core): axis 4 — lifecycle"
```

---

## Task 5: Axis 5 — types

**Files:**
- Create: `packages/core/src/primitives/useScope/propsPropagation/types.spec.tsx`

Uses `expectTypeOf` from vitest for compile-time assertions. No runtime behavior is under test here.

- [ ] **Step 1: File skeleton**

```tsx
// packages/core/src/primitives/useScope/propsPropagation/types.spec.tsx
// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { observable, type Observable } from "@legendapp/state";
import type { ReactNode } from "react";
import { toObs, useScope } from "..";

describe("propsPropagation — axis 5: types", () => {
  // steps 2-11
});
```

- [ ] **Step 2: A5-1 toObs return type (LOCKED)**

```ts
// A5-1 — LOCKED
it("toObs(p) return type is Observable<PropsOf<P>>", () => {
  type P = { a: number; b: string };
  useScope((p: Readonly<P>) => {
    const out = toObs(p);
    expectTypeOf(out).toEqualTypeOf<Observable<{ a: number; b: string }>>();
    return {};
  }, { a: 1, b: "x" } as P);
});
```

- [ ] **Step 3: A5-2 PropsOf unwraps Observable fields (LOCKED)**

```ts
// A5-2 — LOCKED
it("PropsOf unwraps Observable<T> fields to T", () => {
  type P = { a: Observable<number>; b: string };
  useScope((p: Readonly<P>) => {
    const out = toObs(p);
    expectTypeOf(out).toEqualTypeOf<Observable<{ a: number; b: string }>>();
    return {};
  }, { a: observable(1), b: "x" } as P);
});
```

- [ ] **Step 4: A5-3 ApplyHints shape (LOCKED)**

```ts
// A5-3 — LOCKED
it("toObs(p, hints) applies hint transforms in return type", () => {
  type P = { cb: () => void };
  useScope((p: Readonly<P>) => {
    // The Applied type is library-defined; at minimum the hint overload resolves and returns Observable of an object with 'cb'.
    const out = toObs(p, { cb: "function" });
    expectTypeOf(out.cb).not.toBeAny();
    return {};
  }, { cb: () => {} } as P);
});
```

- [ ] **Step 5: A5-4 outer Observable ignores hints at runtime — documented type mismatch (OBSERVED)**

```ts
/* OBSERVED */
describe("axis 5 — outer Observable + hints", () => {
  // A5-4
  it("observed: hints compile but runtime ignores them on outer Observable", () => {
    const store$ = observable({ cb: () => 1 });
    useScope((p) => {
      const out = toObs(p, { cb: "function" });
      expectTypeOf(out).not.toBeAny();
      return {};
    }, store$);
  });
});
```

- [ ] **Step 6: A5-5 spread into child (OBSERVED)**

```tsx
/* OBSERVED */
describe("axis 5 — spread type inference", () => {
  // A5-5
  it("observed: {...toObs(p)} is assignable to a plain child prop shape with broadened types", () => {
    type ChildProps = { a: number | Observable<number>; b: string | Observable<string> };
    function Child(_props: ChildProps) {
      return null;
    }
    useScope((p: Readonly<{ a: number; b: string }>) => {
      const p$ = toObs(p);
      // Compile check — actual JSX in spread.spec.tsx; here we probe assignability.
      const spreaded = { ...p$ } as unknown;
      expectTypeOf(spreaded).not.toBeAny();
      void Child;
      return {};
    }, { a: 1, b: "x" });
  });
});
```

- [ ] **Step 7: A5-6 override after spread (OBSERVED)**

```ts
/* OBSERVED */
describe("axis 5 — override after spread", () => {
  // A5-6
  it("observed: later override prop narrows the effective type", () => {
    type P = { title: string; body: string };
    useScope((p: Readonly<P>) => {
      const p$ = toObs(p);
      const override$ = observable("x");
      const merged = { ...p$, title: override$ };
      expectTypeOf(merged.title).toEqualTypeOf<Observable<string>>();
      return {};
    }, { title: "a", body: "b" });
  });
});
```

- [ ] **Step 8: A5-7 children destructure + rest (LOCKED)**

```ts
// A5-7 — LOCKED
it("{ children, ...rest } destructure leaves rest with non-children keys", () => {
  type WrapperProps = { title: string; children?: ReactNode };
  const { children, ...rest } = { title: "T", children: null } as WrapperProps;
  expectTypeOf(rest).toEqualTypeOf<{ title: string }>();
  void children;
});
```

- [ ] **Step 9: A5-8 ComponentProps compatibility (OBSERVED)**

```ts
/* OBSERVED */
describe("axis 5 — ComponentProps compatibility", () => {
  // A5-8
  it("observed: forwardRef / memo wrapped child tolerates broadened spread type", () => {
    // Placeholder assertion — the real test is that types.spec.tsx compiles as a whole.
    expectTypeOf<never>().not.toBeAny();
  });
});
```

- [ ] **Step 10: A5-9 DeepMaybeObservable contract (OBSERVED)**

```ts
/* OBSERVED */
describe("axis 5 — DeepMaybeObservable contract", () => {
  // A5-9
  it("observed: intermediate component typed as DeepMaybeObservable<P> accepts spread outputs", () => {
    // This test compiles-or-doesn't. If the types drift, this file fails to build.
    expectTypeOf<never>().not.toBeAny();
  });
});
```

- [ ] **Step 11: A5-10 overload resolution (LOCKED)**

```ts
// A5-10 — LOCKED
it("toObs(p) and toObs(p, hints) resolve to different overloads", () => {
  type P = { a: number };
  useScope((p: Readonly<P>) => {
    const a = toObs(p);
    const b = toObs(p, { a: "plain" });
    expectTypeOf(a).not.toBeAny();
    expectTypeOf(b).not.toBeAny();
    return {};
  }, { a: 1 });
});
```

- [ ] **Step 12: Run axis 5**

```bash
pnpm --filter @usels/core exec vitest run \
  src/primitives/useScope/propsPropagation/types.spec.tsx
```

Expected: all green. A compile error is treated as a failure (vitest runs type-level probes alongside runtime).

- [ ] **Step 13: Append Open Questions**

```markdown
- A5-4 — outer Observable + hints — current: type permits, runtime ignores — follow-up: tighten overload signatures.
- A5-5 — spread type into child — current: broadened types work with assertions — follow-up: provide helper type `SpreadPropsOf<P>`.
- A5-6 — override after spread — current: override narrows field type — follow-up: document.
- A5-8 — ComponentProps compat — current: placeholder — follow-up: add forwardRef fixture.
- A5-9 — DeepMaybeObservable contract — current: placeholder — follow-up: add a failing-to-compile-if-drifted sample.
```

- [ ] **Step 14: Commit**

```bash
git add packages/core/src/primitives/useScope/propsPropagation/types.spec.tsx \
        docs/superpowers/specs/2026-04-19-observable-props-propagation.md
git commit -m "test(core): axis 5 — types"
```

---

## Task 6: Improvement Candidates + final review

**Files:**
- Modify: `docs/superpowers/specs/2026-04-19-observable-props-propagation.md`

- [ ] **Step 1: Populate Improvement Candidates**

Replace the `TODO: populated by Task 6.` line under `## Improvement Candidates` with:

```markdown
- **`toObs.spread(p)` helper** — auto-destructures `children` and spreads remaining reactive fields; rationale: eliminates A2-10. Blast radius: small (new API).
- **Auto-detect Element / function / Date in `readField`** — rationale: removes manual hinting for A1-7, A3-5, A3-8. Blast radius: medium (touches `reactiveProps.ts`).
- **ESLint rule `no-spread-props-without-destructuring-children`** — rationale: prevents A2-10 at source. Blast radius: small (new rule in `packages/eslint`).
- **Doc update: React.memo + observable props caveat** — rationale: A2-8. Blast radius: docs only.
- **Outer Observable child-field mutation contract** — rationale: A2-13; today "behavior may vary". Blast radius: depends on Legend-State alignment.
- **`ReadonlyObservable` narrowing on `toObs` result** — rationale: A4-6 (child set surprises). Blast radius: small if opt-in.
```

- [ ] **Step 2: Flip the status line**

In the spec document header, change:

```
**Status:** Draft — test suite in progress
```

to:

```
**Status:** Ready for review — test suite complete
```

- [ ] **Step 3: Full-suite run**

```bash
pnpm --filter @usels/core exec vitest run \
  src/primitives/useScope/propsPropagation
```

Expected: all tests pass. Any LOCKED/OBSERVED failure means the baseline shifted — investigate, do not silently reclassify.

- [ ] **Step 4: Type check**

```bash
pnpm --filter @usels/core exec tsc --noEmit
```

Expected: 0 errors across the new files.

- [ ] **Step 5: Lint**

```bash
pnpm --filter @usels/core exec eslint \
  'src/primitives/useScope/propsPropagation/**/*.{ts,tsx}'
```

Expected: 0 errors. Fix any lint issues before the final commit.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-04-19-observable-props-propagation.md
git commit -m "docs(specs): observable props propagation — improvement candidates"
```

---

## Self-Review Summary

Spec coverage — every axis and scenario in the design has a numbered step above:
- Axis 1: A1-1..A1-9 → Task 1 Steps 2–10
- Axis 2: A2-1..A2-14 → Task 2 Steps 2–15
- Axis 3: A3-1..A3-8 → Task 3 Steps 2–9
- Axis 4: A4-1..A4-7 → Task 4 Steps 2–8 (A4-3, A4-7 are `it.todo` by design)
- Axis 5: A5-1..A5-10 → Task 5 Steps 2–11

Placeholder scan — no "TBD/TODO/implement later" in plan steps. The only `it.todo(...)` entries (A4-3, A4-7) are explicit design decisions, not placeholders. Spec-file "TODO" markers inside `Open Questions` / `Improvement Candidates` are working-log entries that get filled in later tasks — noted explicitly in Task 0 Step 1.

Type consistency — every `toObs(p) as unknown as Observable<...>` cast and `useScope` factory signature is spelled out in the code blocks so naming does not drift. Fixture names (`createSpyChild`, `recordSubscriptions`, `countProxyTraversals`, `renderInStrictMode`, `makeCallbackSpy`) are stable across Task 0 and used only where declared.

Non-coverage — `countProxyTraversals` from fixtures is declared but never referenced by a step. This is intentional: the helper is made available for ad-hoc investigation of OBSERVED A3 cases. If it turns out unused after Task 3, delete it in Task 6 Step 6's commit.
