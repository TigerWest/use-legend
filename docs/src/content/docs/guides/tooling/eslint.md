---
title: ESLint
description: Catch observable naming, JSX reads, hook return naming, and rendering boundary issues with @usels/eslint-plugin.
---

`@usels/eslint-plugin` catches common mistakes in observable-first React code.
Use it to keep `$` naming, JSX reads, and render boundary rules consistent.

## Install

```bash
pnpm add -D @usels/eslint-plugin eslint@^9
```

The plugin targets ESLint v9 flat config.

## Recommended Config

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";

export default [legendPlugin.configs.recommended];
```

Use `recommended` for existing codebases. It enables core correctness rules and
keeps the highest-churn conditional rule off.

## Strict Config

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";

export default [legendPlugin.configs.strict];
```

Use `strict` for new codebases that are fully committed to observable-first
rendering patterns.

## Rules

| Rule | Recommended | Strict | Purpose |
| --- | --- | --- | --- |
| `use-legend/observable-naming` | `error` | `error` | Observable variables should end with `$` |
| `use-legend/no-observable-in-jsx` | `error` | `error` | JSX should read observables with `.get()` or pass them to supported reactive props |
| `use-legend/hook-return-naming` | `warn` | `error` | Preserve `$` suffix when renaming observable fields |
| `use-legend/prefer-for-component` | `warn` | `error` | Prefer `For` over `.map()` on observable arrays |
| `use-legend/prefer-show-for-conditional` | `off` | `error` | Prefer `Show` for observable conditionals |
| `use-legend/prefer-use-observable` | `warn` | `error` | Prefer observable state over `useState` when fine-grained updates matter |
| `use-legend/prefer-use-observe` | `warn` | `error` | Prefer observable effects over `useEffect` for observable reads |
| `use-legend/no-get-in-non-reactive` | `warn` | `error` | Avoid one-time `.get()` snapshots in component or hook bodies |
| `use-legend/no-hooks-in-scope` | `error` | `error` | Avoid React hook calls inside scope bodies |

## Manual Setup

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";

export default [
  {
    plugins: { "use-legend": legendPlugin },
    rules: {
      "use-legend/observable-naming": "error",
      "use-legend/no-observable-in-jsx": "error",
      "use-legend/no-hooks-in-scope": "error",
    },
  },
];
```

Pair the ESLint plugin with the [Vite](/use-legend/guides/tooling/vite/) or
[Babel / Next.js](/use-legend/guides/tooling/babel-nextjs/) transform.
