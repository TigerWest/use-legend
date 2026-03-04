---
name: type-test-guide
description: Guide for writing TypeScript type-level tests (types.spec.ts) using Vitest expectTypeOf
---

## types.spec.ts — TypeScript Type-Level Tests

Compile-time type contract tests using Vitest's `expectTypeOf`.
Verifies return types, option types, overload resolution, and generic inference
without runtime hook execution.

Runs alongside runtime tests via `typecheck.enabled: true` in `vitest.config.ts`.

### Applicable Hooks

Hooks with any of:
- Overloaded signatures (parameter/return type varies by call pattern)
- Complex generics (`TData`, `TError`, etc.)
- `DeepMaybeObservable` options (Observable per-field acceptance)
- Union target types (`MaybeElement`)

### What to Include

| Category                          | Examples                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Return type structure             | `x$ is Observable<number>`                                                   |
| DeepMaybeObservable acceptance    | `accepts Observable<boolean> for reset option`                               |
| Invalid option rejection          | `@ts-expect-error — string is not assignable to boolean option`              |
| Overload parameter discrimination | `callable with number shorthand`, `callable with UseAnimateOptions object`   |
| Overload return type difference   | `number arg → returns UseAnimateReturn`, `object arg → returns same`         |
| Per-parameter type extraction     | `parameter(2) includes number | DeepMaybeObservable<UseAnimateOptions>`      |
| Generic inference                 | `queryFn returning Promise<User> → result data is User | undefined`          |
| null target acceptance            | `callable with null as first argument`                                       |

### Test Patterns

```ts
import { describe, it, expectTypeOf } from "vitest";
import { observable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";

// ── Return type field verification ──
it("x$ is Observable<number>", () => {
  expectTypeOf<UseElementBoundingReturn["x$"]>()
    .toEqualTypeOf<Observable<number>>();
});

// ── Function accepts valid params (DeepMaybeObservable) ──
it("accepts Observable<boolean> for reset option", () => {
  expectTypeOf<typeof useElementBounding>()
    .toBeCallableWith(el$, { reset: observable(true) });
});

// ── Invalid option rejection ──
it("rejects string for boolean option", () => {
  // @ts-expect-error — reset must be boolean | Observable<boolean>
  const _: UseElementBoundingOptions = { reset: "string" };
});

// ── Overload: parameter type → return type ──
it("number shorthand returns UseAnimateReturn", () => {
  expectTypeOf<typeof useAnimate>()
    .toBeCallableWith(el$, keyframes, 300)
    .returns.toEqualTypeOf<UseAnimateReturn>();
});

it("object options returns UseAnimateReturn", () => {
  expectTypeOf<typeof useAnimate>()
    .toBeCallableWith(el$, keyframes, { duration: 300, fill: "forwards" })
    .returns.toEqualTypeOf<UseAnimateReturn>();
});

// ── Per-parameter type extraction ──
it("second parameter accepts Keyframe[] or PropertyIndexedKeyframes", () => {
  expectTypeOf<typeof useAnimate>()
    .parameter(1)
    .toEqualTypeOf<UseAnimateKeyframes>();
});

// ── Overload: subsequent parameter type after callable check ──
it("when first arg is string[], second arg accepts {force: boolean}", () => {
  expectTypeOf<Delete>()
    .toBeCallableWith(["a", "b"])
    .parameter(1)
    .toEqualTypeOf<{ force: boolean } | undefined>();
});

// ── Generic inference from argument types ──
it("infers TData from queryFn return type", () => {
  type Opts = { queryKey: string[]; queryFn: () => Promise<{ id: number }> };
  expectTypeOf<typeof useQuery<{ id: number }>>()
    .returns
    .toHaveProperty("data");
});

// ── null target acceptance ──
it("accepts null as target", () => {
  expectTypeOf<typeof useElementBounding>()
    .toBeCallableWith(null);
});
```

### Principles

- Use `expectTypeOf<typeof hook>()` to test function signatures — never call hooks at runtime
- Use `.toBeCallableWith()` to test overload resolution and argument acceptance
- Chain `.returns` / `.parameter(n)` after `.toBeCallableWith()` for overload-specific checks
- Use `expectTypeOf<ReturnType["field"]>()` for return type field verification
- Use `// @ts-expect-error` to verify that invalid usage produces a compile error
- Use `.toEqualTypeOf<T>()` for exact match; use `.toExtend<T>()` only when subtype matching is intended
- No runtime assertions (`expect()`) — this file is purely type-level
- One `it` block per type contract

### describe Naming Convention

```ts
// types.spec.ts
describe('useMyHook() — types', () => {
  describe('return type', () => { ... });
  describe('option types', () => { ... });
  describe('overloads', () => { ... });
  describe('generic inference', () => { ... });
});
```
