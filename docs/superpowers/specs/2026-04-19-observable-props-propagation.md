# Observable Props Propagation — Edge Case Map & Test Suite

**Status:** Ready for review — test suite complete
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

- A1-4 — nested plain field onChange scope — `propsPropagation/index.spec.tsx` — current: only changed leaf fires — follow-up: confirm desired with Legend-State team.
- A1-5 — nested Observable field propagation (plan hypothesis wrong) — `propsPropagation/index.spec.tsx` — current: top-level `onChange` on inner$ drives `ctx.props$.coord.set(inner$.peek())`, so `inner$.x.set(v)` does reach `p$.coord.x`; promoted to LOCKED — follow-up: confirm this is intended and document, since it contradicts the guide note about child-field mutation on outer Observables.
- A1-6 — function prop without hint — `propsPropagation/index.spec.tsx` — current: fires onChange on each new reference — follow-up: recommend 'function' hint always; consider auto-detect.
- A1-7 — HTMLElement prop without hint — `propsPropagation/index.spec.tsx` — current: no throw in minimal case; may deep-proxy — follow-up: covered in Axis 3.
- A2-2 — 2-tier scope chain propagation — `propsPropagation/spread.spec.tsx` — current: parent rerender drives child toObs via per-field onChange — follow-up: measure subscription count per tier.
- A2-3 — outer Observable spread exposes source store — `propsPropagation/spread.spec.tsx` — current: child holds store references directly — follow-up: document or guard against accidental store leakage.
- A2-4 — plain child re-renders with parent (no isolation) — `propsPropagation/spread.spec.tsx` — reclassified to OBSERVED (plan expected LOCKED isolation) — current: plain React child re-renders once per parent render — follow-up: recommend `React.memo` or a selector helper (`toObsSpread`?) for true isolation.
- A2-5 — field override after spread — `propsPropagation/spread.spec.tsx` — current: override wins, reactivity preserved — follow-up: add to component-props docs.
- A2-6 — conditional spread — `propsPropagation/spread.spec.tsx` — current: both branches allocate scope on visit — follow-up: verify cleanup on branch switch.
- A2-7 — 3-tier chain — `propsPropagation/spread.spec.tsx` — current: leaf stays reactive — follow-up: measure re-render amplification cost.
- A2-8 — React.memo blocks observable-prop change — `propsPropagation/spread.spec.tsx` — EXPECT-FAIL — follow-up: doc anti-pattern or provide helper.
- A2-10 — children passed through toObs still renders — `propsPropagation/spread.spec.tsx` — promoted to LOCKED (plan expected EXPECT-FAIL) — current: Legend-State unwraps ReactNode via `.children.get()` successfully — follow-up: still recommend `const { children, ...rest } = props` before `toObs(rest)` because reactive tracking on children has no value and risks over-rendering.
- A2-12 — nested plain re-render — `propsPropagation/spread.spec.tsx` — current: leaf reads updated nested value — follow-up: confirm Legend-State recursive diff semantics.
- A2-13 — outer Observable child-field mutation — `propsPropagation/spread.spec.tsx` — EXPECT-FAIL — follow-up: guide already notes this; confirm with upstream.
- A2-14 — function-hinted field peek not callable end-to-end after spread — `propsPropagation/spread.spec.tsx` — demoted to EXPECT-FAIL (plan expected OBSERVED happy-path) — current: `p$.onSubmit.peek()?.()` throws because the peeked value of a 'function'-hinted child observable is not a plain callable after the spread round-trip — follow-up: either (a) ensure 'function' hint round-trips cleanly when re-wrapped by a child's `toObs`, or (b) document the recommended access pattern (e.g. raw `p.onSubmit` instead of `p$.onSubmit.peek()`).
- A3-1 — Date without hint — current: peek is a Date — follow-up: confirm no silent deep-proxy on large payloads.
- A3-2 — Map/Set — current: 'opaque' preserves reference — follow-up: auto-opaque for non-plain built-ins.
- A3-3 — class instance — current: methods survive with 'opaque' — follow-up: document requirement.
- A3-5 — DOM without hint — promoted to LOCKED (plan expected EXPECT-FAIL) — current: peek of an unhinted HTMLElement field returns the raw element reference, so deep-proxying does not happen in this minimal case — follow-up: measure whether larger/nested DOM subtrees still avoid deep-proxying, and auto-opaque Element values anyway for safety.
- A3-6 — circular ref — current: no throw with 'opaque' — follow-up: test plain path.
- A3-7 — 'function' hint invokes on peek — reframed (plan expected peek=>fn reference) — current: `peek()` on a function-hinted field returns the invoked result because `ObservableHint.function` gives Legend-State computed-function semantics — follow-up: document the peek-invokes contract; decide if a separate `.fnRef` access path is needed to retrieve the reference.
- A3-8 — function without hint — current: peek/invoke behavior is Legend-State-owned; test records only that peek returns *a* value before and after rerender — follow-up: confirm Legend-State's computed-function invalidation policy for props bearing function values without an explicit hint.
- A4-2 — key remount — current: fresh scope, previous detaches — follow-up: instrument subscription counts.
- A4-3 — Suspense — TODO — follow-up: add controlled-thenable fixture.
- A4-4 — SSR — current: no-throw on render — follow-up: add a true renderToString path.
- A4-6 — child writes to props$ — current: plan's assertion had a typeof/value mismatch that was fixed; current runtime either silently accepts or mirrors on next sync — follow-up: consider readonly narrowing so the type system forbids child .set on a toObs-derived observable.
- A4-7 — Concurrent rendering — TODO — follow-up: build useTransition fixture.
- A5-4 — outer Observable + hints — current: type permits, runtime ignores — follow-up: tighten overload signatures.
- A5-5 — spread type into child — current: broadened types work with assertions — follow-up: provide helper type `SpreadPropsOf<P>`.
- A5-6 — override after spread — current: override narrows field type — follow-up: document.
- A5-8 — ComponentProps compat — current: placeholder — follow-up: add forwardRef fixture.
- A5-9 — DeepMaybeObservable contract — current: placeholder — follow-up: add a failing-to-compile-if-drifted sample.
- Note — the plan's types.spec.tsx called `useScope(...)` at module/test-body level, which threw at runtime because `useScope` reads from a React context. All type tests were wrapped in `renderHook(() => ...)` to match the existing `types.spec.ts` convention in the same package.

## Improvement Candidates

(Populated during implementation. Each entry: title — rationale — estimated
blast radius.)

- **`toObs.spread(p)` helper** — auto-destructures `children` and spreads the remaining reactive fields into a prop object suitable for `<Child {...spread} />`. Rationale: fixes A2-10's anti-pattern (children passed through toObs) at the library level and keeps call sites ergonomic. Blast radius: small (new API; no breaking change).
- **Auto-detect Element / function / Date in `readField`** — today callers must manually pass `'element'`, `'function'`, or `'opaque'` hints. Rationale: removes the manual hinting burden for A1-7, A3-5, and A3-8 and reduces the surface for mistakes. Blast radius: medium (touches `reactiveProps.ts` + `hints.ts`; must not regress the existing explicit-hint path).
- **ESLint rule `no-spread-props-without-destructuring-children`** — detects `toObs(props)` where `children` is still present on the props object, and reports the anti-pattern from A2-10. Rationale: prevents the anti-pattern at source. Blast radius: small (new rule in `packages/eslint`; runs opt-in).
- **Doc update: React.memo + observable props caveat** — record A2-8's EXPECT-FAIL in the library guide so readers know memo blocks observable-prop change unless the child uses a reactive read. Blast radius: docs only.
- **Outer Observable child-field mutation contract** — A2-13 confirms the "behavior may vary" note today, but we should (a) align with Legend-State upstream on the desired contract and (b) tighten the guide to steer callers to full-object replace or per-field observables. Blast radius: depends on upstream alignment; guide-only if we choose to document rather than fix.
- **`ReadonlyObservable` narrowing on `toObs` result** — A4-6 records that a child can `.set(999)` on the props$-derived observable today. Rationale: narrowing the `toObs` return type to `ReadonlyObservable` at the type level would catch accidental child writes at compile time. Blast radius: small if opt-in (new overload), medium if applied to the default signature (some callers might need to cast).
- **Function-hint round-trip through spread** — A2-14 failure: `p$.onSubmit.peek()?.()` on a child that re-wraps a spread-delivered 'function' field does not return a callable. Rationale: spread propagation should preserve the 'function' hint contract end-to-end so the child sees `Observable<() => R>` with a peek-returns-the-fn semantic, or the docs must steer callers to the raw-prop access path. Blast radius: medium (either hint-plumbing fix in `reactiveProps.ts`, or a documentation change plus a small API convention).

## Links

- Plan: `docs/superpowers/plans/2026-04-19-observable-props-propagation.md`
- Library guide: `.claude/rules/library-implementation-guide.md`
- Component props guide: `skills/use-legend-best-practices/references/component-props.md`
- Testing guide: `.claude/rules/testing-guide.md`
- `toObs` source: `packages/core/src/primitives/useScope/reactiveProps.ts`
