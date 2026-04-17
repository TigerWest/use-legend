---
name: use-legend-best-practices
description: MUST be used when building React components with @usels/core, @usels/web, @usels/integrations, "use scope" directive, or observable-bearing props. Covers scope rules, reactive reads, component props, rendering boundaries, library hook interop, third-party integration, and mixing with normal React hooks.
---

# use-legend Best Practices Workflow

Use this skill as an instruction set. Follow the workflow in order.

## Core Principles

- **"use scope" first:** observable state at root, fine-grained reads at leaf.
- **No React hooks in scope:** use `observable`/`createRef$`/`observe`/`onMount` instead.
- **Pass through, don't unwrap:** intermediate components forward observable props as-is.
- **Leaf reads only:** `.get()` inline in JSX or inside reactive contexts (`observe`, `observable(() => ...)`).
- **Normal React hooks at leaf only:** prevent re-render propagation up the tree.

## 1) Read core references (required)

Before implementing any component, read and apply these 5 references. Keep them in active working context for the entire task.

- `references/scope-directive.md` -- what `"use scope"` is, what's allowed, what's banned
- `references/auto-tracking.md` -- how the Babel plugin detects `.get()`, what it cannot detect (`get()` function), source subset rule
- `references/reactive-reads.md` -- `.get()` / `.peek()` / `get()` / `peek()` rules and anti-patterns
- `references/component-props.md` -- `DeepMaybeObservable<Props>`, `toObs()`, pass-through, children, callbacks
- `references/component-boundaries.md` -- `<For>` / `<Show>` / `<Memo>`, leaf-only state hooks

## 2) Load conditional references when needed

Do not load by default. Load only when the requirement exists:

- Using library core functions (`createDebounced`, `createElementSize`, etc.) -> `references/hooks-interop.md`
- Integrating 3rd-party components (MUI, chart libs, form libs, ref forwarding) -> `references/third-party-interop.md`
- Mixing normal React hooks (`useState`, `useQuery`, etc.) or non-scope components -> `references/work-with-react-hooks.md`
- Using derived observables, effects (`observe`, `watch`, `whenever`) -> `references/derived-state-and-effects.md`

## 3) Final self-check before finishing

- No React hooks inside `"use scope"` block
- `.get()` **method** only inline in JSX or inside reactive contexts (`observe`, `observable(() => ...)`)
- No `get()` **function** in JSX -- it's a plain function call, Babel plugin cannot detect it
- Props converted via `toObs()` inside scope, then read with `.get()` method for autoWrap
- No snapshot variables (`const x = obs$.get()`)
- No early return with `.get()` -- use `<Show>` or ternary in JSX
- Lists use `<For each={arr$}>`, not `.get().map()`
- Conditions use `<Show if={cond$}>`, not `cond$.get() && ...`
- `useState`/`useReducer` only in leaf components (prevent parent re-render propagation)
- Props typed as `DeepMaybeObservable<RawProps>` -- raw types without `$` suffix
- Intermediate components pass observable props through, no eager unwrap
- Observable values to 3rd-party components: `.get()` at leaf wrapper boundary
- `children` destructured directly, never passed through `toObs()`
- Derived state uses computed `observable(() => ...)`, not effects that mirror state
