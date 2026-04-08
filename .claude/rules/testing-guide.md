---
paths:
  - "packages/core/src/**/*.spec.ts"
  - "packages/core/src/**/*.spec.tsx"
  - "packages/web/src/**/*.spec.tsx"
  - "packages/web/src/**/*.spec.ts"
  - "packages/integrations/src/**/*.spec.ts"
  - "packages/integrations/src/**/*.spec.tsx"
---

# Testing Guide

Separate test files by category within each hook directory (`packages/core/src/{category}/{hookName}/`).

## File Classification

```
packages/core/src/{category}/{hookName}/
  index.spec.ts          # Core functionality tests
  rerender.spec.ts       # Rerender stability tests
  lifecycle.spec.ts      # Element lifecycle resource management tests
  observable.spec.ts     # Observable / reactive option tests
  edgeCases.spec.ts      # Edge case tests
  types.spec.ts          # TypeScript type-level tests
  # Browser variants (when a category needs real browser APIs)
  # {category}.browser.spec.ts
  # e.g. lifecycle.browser.spec.ts, rerender.browser.spec.ts
```

Not every file is required. Only create files relevant to the hook's characteristics.
Any category file can have a `.browser.spec.ts` variant when its scenarios require a real browser
(e.g. `lifecycle.browser.spec.ts`, `rerender.browser.spec.ts`).
The browser variant follows the same structure and naming conventions as its JSDOM counterpart.

---

## index.spec.ts — Core Functionality Tests

Unit tests verifying the hook's primary behavior.
Runs in JSDOM; browser APIs are mocked.

### What to Include

| Category                    | Examples                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| Return type / structure     | `returns an Observable`, `returns { width$, height$ }`                  |
| Initial state               | `initial value is 0`, `initial isActive is true`                        |
| Core behavior               | `updates value when event fires`, `increments counter each tick`        |
| Option behavior             | `passes threshold option to observer`, `immediate=false does not start` |
| pause / resume / stop       | `pause() stops the loop`, `resume() restarts after pause`               |
| Unmount cleanup             | `removes listener on unmount`, `clears interval on unmount`             |
| null/undefined target guard | `does not throw when target is null`                                    |
| SSR guard                   | `returns fallback when window is undefined`                             |

### Principles

- One `it` block verifies one behavior
- Minimize mocks — prefer real DOM events when possible
- Group with `describe` blocks (e.g. `initial values`, `controls`, `cleanup`)

---

## rerender.spec.ts — Rerender Stability Tests

Verify the hook remains stable when an unrelated state change triggers a React re-render.

### What to Include

| Category                    | Examples                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| No resource re-registration | `does not re-register listener when unrelated state causes re-render` |
| No observer recreation      | `does not re-create ResizeObserver on re-render`                      |
| No timer restart            | `does not restart RAF loop on re-render`                              |
| Value accuracy preserved    | `width$ remains accurate after re-render`                             |
| Callback freshness          | `callback uses latest closure after re-render`                        |
| Stable return references    | `returned cleanup function identity is stable across re-renders`      |
| State preservation          | `isActive$ remains true during re-render`                             |
| Mid-operation preservation  | `drag state persists when re-render occurs mid-drag`                  |

### Test Pattern

```tsx
// Trigger re-render via unrelated state change
function TestComponent() {
  const [unrelated, setUnrelated] = useState(0);
  const result = useMyHook(target, options);
  return <button onClick={() => setUnrelated((v) => v + 1)} />;
}

// Using renderHook's rerender()
const { rerender } = renderHook((props) => useMyHook(props.target, props.options), {
  initialProps: { target, options },
});
rerender({ target, options }); // same props, new render
```

### Verification Points

- `addEventListener` / `removeEventListener` call counts do not increase
- `new ResizeObserver` / `new IntersectionObserver` not recreated
- `setInterval` / `setTimeout` / `requestAnimationFrame` not re-invoked
- Observable values remain identical before and after re-render

---

## lifecycle.spec.ts — Element Lifecycle Resource Management Tests

Verify that when an element within a component is conditionally rendered via state,
resources are properly cleaned up when the Ref$/Observable target transitions to null
and properly re-registered when it transitions back to an element.

### Applicable Hooks

Only for hooks that accept an element target:
`useEventListener`, `useDraggable`, `useDropZone`, `useElementBounding`,
`useElementSize`, `useElementVisibility`, `useIntersectionObserver`,
`useMouseInElement`, `useMutationObserver`, `useResizeObserver`,
`useScroll`, `useAnimate`, etc.

### What to Include

| Category                      | Examples                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| null → element registration   | `Ref$ null → element: observer starts observing`                       |
| element → null cleanup        | `Ref$ element → null: observer is disconnected`                        |
| Full cycle                    | `null → element → null → element: no resource leaks`                   |
| State reset                   | `values reset to defaults when element is removed`                     |
| In-progress cancellation      | `in-progress drag cancelled when element is removed`                   |
| Old element isolation         | `events on old element are not reported after target change`           |
| Leak verification             | `addEventListener/removeEventListener call counts are symmetric`       |
| **Functional after mount**    | `dispatched event updates state after element mount`                   |
| **Functional after re-mount** | `dispatched event updates state after null → element → null → element` |

### Test Pattern

```tsx
// Ref$-based — simulating conditional rendering
const el$ = useRef$<HTMLDivElement>();
act(() => el$(document.createElement("div"))); // mount
act(() => el$(null)); // unmount
act(() => el$(document.createElement("div"))); // remount

// Observable-based
const target$ = observable<OpaqueObject<HTMLElement> | null>(null);
act(() => target$.set(ObservableHint.opaque(element))); // mount
act(() => target$.set(null)); // unmount
```

### Verification Points

- On element removal: `disconnect()`, `removeEventListener()`, `cancelAnimationFrame()`, `clearInterval()` called
- On element addition: `observe()`, `addEventListener()`, `requestAnimationFrame()`, `setInterval()` called
- After full cycle: registration/cleanup call counts are symmetric (no leaks)
- Callbacks for the previous element are no longer invoked
- **Functional verification (required):** After mount and re-mount, dispatch a real event on the element and assert that the hook's state actually updates. Spy-based checks (call counts) alone are **not sufficient** — they can pass even when the hook is broken.

> **Warning:** Spy-based lifecycle tests (addEventListener/removeEventListener counts) verify that cleanup code runs, but do NOT verify that the hook actually works after element registration. Always include at least one test per target type (Ref$, Observable) that dispatches a real event after mount and asserts state changes.

### Browser Variant Requirement

Hooks with element targets **should** have a `lifecycle.browser.spec.ts` that runs the same mount/unmount/re-mount scenarios with real DOM events instead of spies. This catches issues that JSDOM-based tests miss (e.g. lazy computed activation, real event propagation, async cleanup timing).

---

## observable.spec.ts — Observable / Reactive Option Tests

Verify the hook correctly resets when `DeepMaybeObservable` options
or `Observable`/`Ref$` targets change reactively.

### What to Include

| Category                                       | Examples                                                      |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Observable option change → resource recreation | `Observable rootMargin change → IO recreated`                 |
| Per-field Observable                           | `per-field scrollTarget$ change triggers observer recreation` |
| Outer Observable full replace                  | `options$.set({...}) → observer recreated with new options`   |
| Observable target switch                       | `Observable target element A → element B: re-observe`         |
| Bidirectional sync                             | `currentTime$ setter updates animation currentTime`           |
| Legend-State edge cases                        | `child-field mutation on outer Observable — known limitation` |

### Test Pattern

```tsx
// Observable option change
const rootMargin$ = observable("0px");
renderHook(() => useMyHook(target, { rootMargin: rootMargin$ }));
act(() => rootMargin$.set("20px"));
// → verify old resource cleanup + new resource creation with updated options

// Outer Observable full replace
const opts$ = observable({ rootMargin: "0px", threshold: 0.5 });
renderHook(() => useMyHook(target, opts$));
act(() => opts$.set({ rootMargin: "20px", threshold: 1.0 }));
```

### Verification Points

- On Observable value change: old resources cleaned up (disconnect, removeEventListener, etc.)
- New resources created with updated values (new Observer, addEventListener, etc.)
- Values are accurate before and after the change
- Per-field vs outer Observable behavior differences with Legend-State

### ⚠️ Never pass an Observable directly to `expect()`

`expect(someObservable$)` causes Vitest to serialize/inspect the value, triggering Legend-State's Proxy to deep-traverse the entire observable tree → infinite recursion → OOM/worker crash.

```ts
// ❌ OOM — Observable passed directly to expect
expect(result.current.p$.obs).toBe(source$);
expect(result.current.someObs$).toBeDefined();

// ✅ Compare using === and pass the boolean result
expect(result.current.p$.obs === source$).toBe(true);

// ✅ Call .get() and pass the plain value
expect(result.current.p$.obs.get()).toBe(42);
```

This applies to any Legend-State `Observable` — including child field observables accessed via `p$.field`.

---

## edgeCases.spec.ts — Edge Case Tests

Boundary conditions, error handling, and special scenarios not covered by core functionality tests.

### What to Include

| Category            | Examples                                                |
| ------------------- | ------------------------------------------------------- |
| Empty array target  | `empty target array does not create observer`           |
| Duplicate targets   | `duplicate targets are deduplicated`                    |
| Timer races         | `rapid pause/resume does not create multiple intervals` |
| Unsupported API     | `isSupported is false when API is unavailable`          |
| Zero value guard    | `initialCount=0 does not auto-start`                    |
| Post-unmount safety | `pause() after unmount does not throw`                  |
| Stale closure       | `stale callback regression guard`                       |
| Overflow prevention | `dragleave counter does not underflow below 0`          |
| Empty results       | `does not throw when entries array is empty`            |
| SVG support         | `works with SVGElement`                                 |

### Principles

- Each TC is based on a discovered or anticipated bug scenario
- Verify defensive code works correctly
- Confirm no errors are thrown in situations that should be safe

---

## \*.browser.spec.ts — Real Browser Environment Tests

Tests that run in a real browser (e.g. Playwright), not JSDOM.
Use when browser APIs cannot be adequately mocked.

`index.browser.spec.ts` covers core functionality in a real browser.
Other categories can also have browser variants when needed:
`lifecycle.browser.spec.ts`, `rerender.browser.spec.ts`, `observable.browser.spec.ts`, etc.
Each browser variant follows the same structure as its JSDOM counterpart.

### What to Include

| Category               | Examples                                                |
| ---------------------- | ------------------------------------------------------- |
| Real observer behavior | `real IntersectionObserver fires with correct entries`  |
| Real events            | `real pointermove updates drag position`                |
| Real layout            | `contentRect reflects actual element dimensions`        |
| Real disconnect        | `callback stops firing after unmount (real disconnect)` |
| Web Animations API     | `auto-plays animation on mount`                         |
| Environment check      | `runs in an actual browser environment (not jsdom)`     |

### Principles

- Only target APIs where JSDOM mocks are incomplete (ResizeObserver, IntersectionObserver, Web Animations, etc.)
- Tests are slower — select only critical scenarios
- Minimize overlap with `index.spec.ts`

---

## types.spec.ts — TypeScript Type-Level Tests

> Full guide: `.claude/skills/type-test-guide.md`

---

## File Selection Guide — Where Does This Test Go?

| Question                                                    | File                    |
| ----------------------------------------------------------- | ----------------------- |
| Does the hook's core functionality work?                    | `index.spec.ts`         |
| Are resources not duplicated on re-render?                  | `rerender.spec.ts`      |
| Are resources properly managed on element appear/disappear? | `lifecycle.spec.ts`     |
| Does the hook react correctly to Observable option changes? | `observable.spec.ts`    |
| Is the hook safe under special/boundary conditions?         | `edgeCases.spec.ts`     |
| Does the test require a real browser API?                   | `index.browser.spec.ts` |
| Does the hook have overloads, generics, or complex types?   | `types.spec.ts`         |

### Required Files by Hook Characteristics

> **⚠️ Multiple characteristics can apply at once.** Check every matching row and union the required files.
> Example: a hook with no element target that uses browser-only APIs still requires `index.browser.spec.ts`.

| Hook Characteristic              | Required Files                                        | Optional Files                                |
| -------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Has element target               | `index`, `rerender`, `lifecycle`, `lifecycle.browser` | `observable`, `edgeCases`, `index.browser`    |
| No element target (timers, etc.) | `index`, `rerender`                                   | `observable`, `edgeCases`                     |
| Has Observable options           | `index`                                               | `observable`                                  |
| **Uses browser-only APIs** (`document`, `window`, DOM manipulation, etc.) | **`index`, `index.browser`** | `lifecycle`, `edgeCases` |
| Has overloads or complex types   | `index`, `types`                                      | (other files as needed)                       |
| Thin wrapper                     | `index`                                               | (most tests delegated to the underlying hook) |

> **Every hook under `packages/web/src/browser/` uses browser-only APIs — `index.browser.spec.ts` is always required.**

---

## describe Naming Convention

```ts
// index.spec.ts
describe('useMyHook()', () => {
  describe('initial values', () => { ... });
  describe('options', () => { ... });
  describe('controls', () => { ... });
  describe('unmount cleanup', () => { ... });
});

// rerender.spec.ts
describe('useMyHook() — rerender stability', () => {
  describe('resource stability', () => { ... });
  describe('value accuracy', () => { ... });
  describe('callback freshness', () => { ... });
});

// lifecycle.spec.ts
describe('useMyHook() — element lifecycle', () => {
  describe('Ref$ target', () => { ... });
  describe('Observable target', () => { ... });
  describe('full cycle (null → element → null → element)', () => { ... });
});

// observable.spec.ts
describe('useMyHook() — reactive options', () => {
  describe('Observable option change', () => { ... });
  describe('per-field Observable', () => { ... });
  describe('outer Observable replace', () => { ... });
});

// edgecases.spec.ts
describe('useMyHook() — edge cases', () => { ... });

// index.browser.spec.ts
describe('useMyHook() — real browser', () => { ... });

// types.spec.ts
describe('useMyHook() — types', () => {
  describe('return type', () => { ... });
  describe('option types', () => { ... });
  describe('overloads', () => { ... });
  describe('generic inference', () => { ... });
});
```
