---
title: ESLint Plugin
description: Catch Legend-State misuse at lint time with @usels/eslint-plugin.
---

`@usels/eslint-plugin` provides ESLint rules for observable naming, JSX reads,
hook returns, and fine-grained render boundaries.

---

## Installation

```bash
npm install -D @usels/eslint-plugin eslint@^9
```

> **Requires ESLint v9** with flat config format (`eslint.config.js`).

---

## Quick Setup

### Recommended config

Enables the default `use-legend` observable conventions.

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";

export default [legendPlugin.configs.recommended];
```

### Strict config

Enables every rule at `error` severity.

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";

export default [legendPlugin.configs.strict];
```

### Manual setup

Pick only the rules you want:

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";

export default [
  {
    plugins: { "use-legend": legendPlugin },
    rules: {
      "use-legend/observable-naming": "error",
      "use-legend/no-observable-in-jsx": "error",
      "use-legend/hook-return-naming": "warn",
      "use-legend/prefer-for-component": "warn",
      "use-legend/prefer-show-for-conditional": "warn",
      "use-legend/prefer-use-observable": "warn",
      "use-legend/prefer-use-observe": "warn",
      "use-legend/no-get-in-non-reactive": "warn",
    },
  },
];
```

---

## Rules

| Rule                                                          | Recommended | Strict  | Description                                                      |
| ------------------------------------------------------------- | ----------- | ------- | ---------------------------------------------------------------- |
| [`observable-naming`](#observable-naming)                     | `error`     | `error` | Variables holding observables must end with `$`                  |
| [`no-observable-in-jsx`](#no-observable-in-jsx)               | `error`     | `error` | Call `.get()` on observables in JSX expressions                  |
| [`hook-return-naming`](#hook-return-naming)                   | `warn`      | `error` | Preserve `$` suffix when renaming destructured observable fields |
| [`prefer-for-component`](#prefer-for-component)               | `warn`      | `error` | Use `<For>` over `.map()` on observable arrays                   |
| [`prefer-use-observable`](#prefer-use-observable)             | `warn`      | `error` | Prefer `useObservable` over React `useState`                     |
| [`prefer-use-observe`](#prefer-use-observe)                   | `warn`      | `error` | Prefer `useObserve` / `useObserveEffect` over React `useEffect`  |
| [`no-get-in-non-reactive`](#no-get-in-non-reactive)           | `warn`      | `error` | Avoid one-time `.get()` snapshots in component or hook bodies    |
| [`prefer-show-for-conditional`](#prefer-show-for-conditional) | `off`       | `error` | Use `<Show>` over `&&` / ternary with observable conditions      |

---

## Rule Details

### `observable-naming`

Variables holding observables must end with `$`.

```ts
// ❌ Error
const count = useObservable(0);
const data = observable({ name: "foo" });

// ✅ Good
const count$ = useObservable(0);
const data$ = observable({ name: "foo" });
```

**Default tracked functions:**

| Package                  | Functions                             |
| ------------------------ | ------------------------------------- |
| `@legendapp/state`       | `observable`, `computed`              |
| `@legendapp/state/react` | `useObservable`, `useObservableState` |
| `@usels/core`            | all exported `use*` hooks             |
| `@usels/web`             | all exported `use*` hooks             |
| `@usels/native`          | all exported `use*` hooks             |

**Options:**

```ts
"use-legend/observable-naming": ["error", {
  "trackFunctions": { /* per-package function names */ },
  "allowPattern": null
}]
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/observable-naming.md)

---

### `no-observable-in-jsx`

Observables used directly in JSX render `[object Object]`. Always call `.get()`
or pass the observable to a component prop that intentionally accepts it.

```tsx
// ❌ Error — renders "[object Object]"
<div>{count$}</div>
<span>{user$.name}</span>

// ✅ Good
<div>{count$.get()}</div>
<span>{user$.name.get()}</span>

// ✅ Good — Legend-State components accept observables intentionally
<Show if={isLoading$}><Spinner /></Show>
<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>
```

**Default allowed props:**

- `Show`: `if`, `ifReady`, `else`
- `For`: `each`
- `Switch`: `value`
- All elements: `ref` (for `useRef$`)

**Options:**

```ts
"use-legend/no-observable-in-jsx": ["error", {
  "allowedJsxComponents": ["Show", "For", "Switch", "Memo", "Computed"],
  "allowedProps": { "Show": ["if", "ifReady", "else"], "For": ["each"] },
  "allowedGlobalProps": ["ref"]
}]
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/no-observable-in-jsx.md)

---

### `hook-return-naming`

When destructuring `$`-suffixed fields, the renamed binding must also end with `$`.

```ts
// ❌ Warning — $ suffix lost
const { x$: x, isDragging$: dragging } = useDraggable(target$);

// ✅ Good — keep shorthand
const { x$, isDragging$ } = useDraggable(target$);

// ✅ Good — rename with $ preserved
const { x$: posX$, isDragging$: dragging$ } = useDraggable(target$);
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/hook-return-naming.md)

---

### `prefer-for-component`

`.get().map()` on an observable array re-renders all items on any change. `<For>`
re-renders only the changed item.

```tsx
// ❌ Warning
{
  items$.get().map((item) => <li key={item.id}>{item.name}</li>);
}

// ✅ Good
<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>;
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-for-component.md)

---

### `prefer-use-observable`

Prefer `useObservable` over React's `useState` when local state should participate
in fine-grained observable updates.

```tsx
// ❌ Warning
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: "" });

// ✅ Good
const count$ = useObservable(0);
const user$ = useObservable({ name: "" });

count$.set((count) => count + 1);
user$.name.set("Ada");
```

**Options:**

```ts
"use-legend/prefer-use-observable": ["warn", {
  "importSources": ["react"],
  "replacements": ["@legendapp/state/react", "@usels/core"],
  "allowPatterns": []
}]
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-use-observable.md)

---

### `prefer-use-observe`

Prefer `useObserve` or `useObserveEffect` over React's `useEffect` in observable
code. The rule is import-based and flags `useEffect` calls from configured
sources.

```tsx
// ❌ Warning
useEffect(() => {
  document.title = title$.get();
}, [title$.get()]);

// ✅ Good
useObserve(() => {
  document.title = title$.get();
});

// ✅ Good — cleanup support
useObserveEffect(() => {
  const unsubscribe = socket$.onChange(({ value }) => connect(value));
  return () => unsubscribe();
});
```

**Options:**

```ts
"use-legend/prefer-use-observe": ["warn", {
  "importSources": ["react"],
  "replacements": ["@legendapp/state/react", "@usels/core"],
  "includeLayoutEffect": false,
  "allowlist": []
}]
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-use-observe.md)

---

### `no-get-in-non-reactive`

Calling `.get()` directly in a React component or hook body takes a one-time
snapshot. Later observable changes are ignored unless the read happens in a
reactive context.

```tsx
// ❌ Warning — one-time snapshot
function Counter() {
  const count = count$.get();
  return <span>{count}</span>;
}

// ✅ Good — render-time reactive boundary
function Counter() {
  return <Memo>{() => count$.get()}</Memo>;
}

// ✅ Good — derived observable
function useDoubleCount() {
  return useObservable(() => count$.get() * 2);
}

// ✅ Good — side effect tracking
function useLogCount() {
  useObserve(() => {
    console.log(count$.get());
  });
}
```

---

### `prefer-show-for-conditional`

`&&` / `||` / ternary with an observable condition causes the parent component to
re-render. Use `<Show>` for fine-grained conditional updates.

```tsx
// ❌ Warning
{isLoading$.get() && <Spinner />}
{isActive$ ? <A /> : <B />}

// ✅ Good
<Show if={isLoading$}><Spinner /></Show>
<Show if={isActive$} else={<B />}><A /></Show>
```

> Note: Complex comparisons like `{count$.get() > 0 && <Badge />}` are not
> detected by this rule. Use `<Show if={() => count$.get() > 0}>` manually for
> these cases.

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-show-for-conditional.md)

---

## Configs Reference

### `recommended`

```js
import legendPlugin from "@usels/eslint-plugin";
export default [legendPlugin.configs.recommended];
```

| Rule                          | Severity |
| ----------------------------- | -------- |
| `observable-naming`           | `error`  |
| `no-observable-in-jsx`        | `error`  |
| `hook-return-naming`          | `warn`   |
| `prefer-show-for-conditional` | `off`    |
| `prefer-for-component`        | `warn`   |
| `prefer-use-observable`       | `warn`   |
| `prefer-use-observe`          | `warn`   |
| `no-get-in-non-reactive`      | `warn`   |

### `strict`

All rules at `error` severity. Recommended for greenfield projects fully
committed to fine-grained reactivity.

```js
import legendPlugin from "@usels/eslint-plugin";
export default [legendPlugin.configs.strict];
```

| Rule                          | Severity |
| ----------------------------- | -------- |
| `observable-naming`           | `error`  |
| `no-observable-in-jsx`        | `error`  |
| `hook-return-naming`          | `error`  |
| `prefer-show-for-conditional` | `error`  |
| `prefer-for-component`        | `error`  |
| `prefer-use-observable`       | `error`  |
| `prefer-use-observe`          | `error`  |
| `no-get-in-non-reactive`      | `error`  |

---

## TypeScript Integration

The plugin is written in TypeScript and ships with type definitions. No extra
configuration is required. Parser is provided separately:

```bash
npm install -D @typescript-eslint/parser
```

```js
// eslint.config.js
import legendPlugin from "@usels/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    languageOptions: { parser: tsParser },
    ...legendPlugin.configs.recommended,
  },
];
```

---

## Tips

- **Enable `observable-naming` first.** Several rules rely on the `$` suffix to
  detect observables. Without it, they may miss some cases.
- **Use `recommended` for existing codebases.** It keeps the higher-churn
  conditional rule off while still warning on list rendering, hook replacements,
  and non-reactive `.get()` snapshots.
- **Use `strict` for new codebases.** It turns every current rule into an error.
- **Pair with the Babel/Vite plugin.** `@usels/vite-plugin` can auto-wrap JSX
  `.get()` reads in `<Memo>` boundaries.
