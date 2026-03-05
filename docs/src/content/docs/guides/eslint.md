---
title: ESLint Plugin
description: Catch Legend-State misuse at lint time with @usels/eslint-plugin.
---

`@usels/eslint-plugin` provides ESLint rules that enforce Legend-State best practices — catching common bugs and style violations before they reach runtime.

---

## Installation

```bash
npm install -D @usels/eslint-plugin eslint@^9
```

> **Requires ESLint v9** with flat config format (`eslint.config.js`).

---

## Quick Setup

### Recommended config

Enables all rules. Phase 1 rules are errors; Phase 2 rules are warnings.

```js
// eslint.config.js
import legendPlugin from '@usels/eslint-plugin';

export default [
  legendPlugin.configs.recommended,
];
```

### Strict config

All rules at `error` severity.

```js
// eslint.config.js
import legendPlugin from '@usels/eslint-plugin';

export default [
  legendPlugin.configs.strict,
];
```

### Manual setup

Pick only the rules you want:

```js
// eslint.config.js
import legendPlugin from '@usels/eslint-plugin';

export default [
  {
    plugins: { 'use-legend': legendPlugin },
    rules: {
      'use-legend/observable-naming':         'error',
      'use-legend/no-observable-in-jsx':      'error',
      'use-legend/hook-return-naming':        'warn',
      'use-legend/no-enable-api':             'warn',
      'use-legend/no-reactive-hoc':           'warn',
      'use-legend/prefer-show-for-conditional': 'warn',
      'use-legend/prefer-for-component':      'warn',
      'use-legend/prefer-use-observable':     'warn',
      'use-legend/prefer-use-observe':        'warn',
    },
  },
];
```

---

## Rules

### Phase 1 — Errors (high confidence)

| Rule | Description |
|------|-------------|
| [`observable-naming`](#observable-naming) | Variables holding observables must end with `$` |
| [`no-observable-in-jsx`](#no-observable-in-jsx) | Call `.get()` on observables in JSX expressions |

### Phase 2 — Warnings (style & best practice)

| Rule | Description |
|------|-------------|
| [`hook-return-naming`](#hook-return-naming) | Preserve `$` suffix when renaming destructured fields |
| [`no-enable-api`](#no-enable-api) | Avoid global `enable*` configuration APIs |
| [`no-reactive-hoc`](#no-reactive-hoc) | Use `<Show>`/`<For>`/`<Memo>` instead of HOCs |
| [`prefer-show-for-conditional`](#prefer-show-for-conditional) | Use `<Show>` over `&&`/ternary with observable conditions |
| [`prefer-for-component`](#prefer-for-component) | Use `<For>` over `.map()` on observable arrays |
| [`prefer-use-observable`](#prefer-use-observable) | Use `useObservable` over `useState` |
| [`prefer-use-observe`](#prefer-use-observe) | Use `useObserve`/`useObserveEffect` over `useEffect` |

---

## Rule Details

### `observable-naming`

Variables holding observables must end with `$`.

```ts
// ❌ Error
const count = useObservable(0);
const data = observable({ name: 'foo' });

// ✅ Good
const count$ = useObservable(0);
const data$ = observable({ name: 'foo' });
```

**Default tracked functions:**

| Package | Functions |
|---------|-----------|
| `@legendapp/state` | `observable`, `computed` |
| `@legendapp/state/react` | `useObservable`, `useObservableState` |
| `@usels/web` | all exported `use*` hooks |
| `@usels/native` | all exported `use*` hooks |

**Options:**
```ts
"use-legend/observable-naming": ["error", {
  "trackFunctions": { /* per-package function names */ },
  "allowPattern": null  // regex to exempt specific names
}]
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/observable-naming.md)

---

### `no-observable-in-jsx`

Observables used directly in JSX render `[object Object]`. Always call `.get()`.

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

### `no-enable-api`

Legend-State's `enable*` APIs mutate global state and conflict with fine-grained reactivity patterns.

```ts
// ❌ Warning
import { enable$GetSet } from '@legendapp/state/config/enable$GetSet';
enable$GetSet();  // conflicts with $ suffix convention

import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
enableReactTracking({ auto: true });  // whole-component re-renders

// ✅ Good — use explicit .get() / .set()
const value = count$.get();
count$.set(value + 1);
```

**Flagged APIs:** `enable$GetSet`, `enable_PeekAssign`, `enableReactTracking`, `enableReactUse`, `enableReactComponents`, `enableReactNativeComponents`

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/no-enable-api.md)

---

### `no-reactive-hoc`

HOCs like `observer()` make the entire component reactive, causing whole-component re-renders.

```tsx
// ❌ Warning — whole component re-renders
import { observer } from '@legendapp/state/react';
const MyComponent = observer(() => <div>{count$.get()}</div>);

// ✅ Good — only Memo re-renders
function MyComponent() {
  return <div><Memo>{() => count$.get()}</Memo></div>;
}
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/no-reactive-hoc.md)

---

### `prefer-show-for-conditional`

`&&` / `||` / ternary with an observable condition causes the parent component to re-render. Use `<Show>` for fine-grained updates.

```tsx
// ❌ Warning
{isLoading$.get() && <Spinner />}
{isActive$ ? <A /> : <B />}

// ✅ Good
<Show if={isLoading$}><Spinner /></Show>
<Show if={isActive$} else={<B />}><A /></Show>
```

> Note: Complex comparisons like `{count$.get() > 0 && <Badge />}` are not detected by this rule. Use `<Show if={() => count$.get() > 0}>` manually for these cases.

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-show-for-conditional.md)

---

### `prefer-for-component`

`.get().map()` on an observable array re-renders all items on any change. `<For>` re-renders only the changed item.

```tsx
// ❌ Warning
{items$.get().map((item) => <li key={item.id}>{item.name}</li>)}

// ✅ Good
<For each={items$}>
  {(item$) => <li>{item$.name.get()}</li>}
</For>
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-for-component.md)

---

### `prefer-use-observable`

`useState` causes full component re-renders. `useObservable` provides fine-grained reactivity and eliminates setter functions.

```tsx
// ❌ Warning
const [count, setCount] = useState(0);

// ✅ Good
const count$ = useObservable(0);
count$.set(c => c + 1);  // no setter needed
```

Use `allowPatterns` to exempt UI-only state:
```ts
"use-legend/prefer-use-observable": ["warn", {
  "allowPatterns": ["^is[A-Z]", "^(open|show|visible)"]
}]
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-use-observable.md)

---

### `prefer-use-observe`

All `useEffect` calls are flagged. `useObserve`/`useObserveEffect` auto-track observable dependencies — no dependency array needed.

```tsx
// ❌ Warning — all useEffect calls flagged
useEffect(() => {
  document.title = user$.name.get();
}, [user$.name.get()]);

// ✅ Good — auto-tracks user$.name
useObserve(() => {
  document.title = user$.name.get();
});

// ✅ Good — with cleanup
useObserveEffect(() => {
  const unsub = count$.onChange(syncToServer);
  return unsub;
});
```

[Full docs →](https://github.com/TigerWest/use-legend/blob/main/packages/eslint/docs/rules/prefer-use-observe.md)

---

## Configs Reference

### `recommended`

```js
import legendPlugin from '@usels/eslint-plugin';
export default [legendPlugin.configs.recommended];
```

| Rule | Severity |
|------|----------|
| `observable-naming` | error |
| `no-observable-in-jsx` | error |
| `hook-return-naming` | warn |
| `no-enable-api` | warn |
| `no-reactive-hoc` | warn |
| `prefer-show-for-conditional` | warn |
| `prefer-for-component` | warn |
| `prefer-use-observable` | warn |
| `prefer-use-observe` | warn |

### `strict`

All rules at `error` severity. Recommended for greenfield projects fully committed to fine-grained reactivity.

```js
import legendPlugin from '@usels/eslint-plugin';
export default [legendPlugin.configs.strict];
```

---

## TypeScript Integration

The plugin is written in TypeScript and ships with type definitions. No extra configuration is required. Parser is provided separately:

```bash
npm install -D @typescript-eslint/parser
```

```js
// eslint.config.js
import legendPlugin from '@usels/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    languageOptions: { parser: tsParser },
    ...legendPlugin.configs.recommended,
  },
];
```

---

## Tips

- **Enable `observable-naming` first.** Several rules (`no-observable-in-jsx`, `prefer-show-for-conditional`, `prefer-for-component`) rely on the `$` suffix to detect observables. Without it, they may miss some cases.
- **Use `allowPatterns` for UI-only state.** `prefer-use-observable` and `prefer-use-observe` can be noisy in existing codebases. Use `allowPatterns` / `allowList` to introduce them incrementally.
- **Pair with the Babel/Vite plugin.** `@usels/vite-plugin-legend-memo` auto-wraps `.get()` calls in `<Memo>`, making `prefer-show-for-conditional` warnings less urgent for simple cases.
