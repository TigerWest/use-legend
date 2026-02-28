# @usels/vite-plugin-legend-memo

A Vite plugin that applies [`@usels/babel-plugin-legend-memo`](../babel) during the transform phase. Automatically wraps Legend-State observable `.get()` calls in JSX with reactive `<Memo>` boundaries for fine-grained reactivity — without any boilerplate.

```tsx
// You write this naturally
<div>{count$.get()}</div>

// Plugin transforms to this automatically
import { Memo } from "@legendapp/state/react";
<div><Memo>{() => count$.get()}</Memo></div>
```

**One plugin replaces two** — no longer need `@legendapp/state/babel` alongside another auto-wrap plugin.

---

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Plugin Order (Critical)](#plugin-order-critical)
- [Configuration](#configuration)
- [Features](#features)
- [Writing Components](#writing-components)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
npm install -D @usels/vite-plugin-legend-memo @usels/babel-plugin-legend-memo @babel/core
# or
pnpm add -D @usels/vite-plugin-legend-memo @usels/babel-plugin-legend-memo @babel/core
# or
yarn add -D @usels/vite-plugin-legend-memo @usels/babel-plugin-legend-memo @babel/core
```

---

## Setup

### Basic

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoWrap } from '@usels/vite-plugin-legend-memo';

export default defineConfig({
  plugins: [
    autoWrap(),   // ← Must be BEFORE react()
    react(),
  ],
});
```

### With options

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoWrap } from '@usels/vite-plugin-legend-memo';

export default defineConfig({
  plugins: [
    autoWrap({
      // Detect all .get() regardless of $ suffix (default: false)
      allGet: false,

      // Auto-wrap Memo/Show/Computed children (default: true)
      wrapReactiveChildren: true,

      // Custom wrapper component (default: "Memo")
      componentName: 'Memo',

      // Import source (default: "@legendapp/state/react")
      importSource: '@legendapp/state/react',
    }),
    react(),
  ],
});
```

### With a different observable library

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoWrap } from '@usels/vite-plugin-legend-memo';

export default defineConfig({
  plugins: [
    autoWrap({
      componentName: 'Auto',
      importSource: '@usels/core',
    }),
    react(),
  ],
});
```

---

## Plugin Order (Critical)

**`autoWrap()` MUST be placed BEFORE `react()` in the plugins array.**

```typescript
// ✅ Correct — autoWrap processes JSX before React plugin
plugins: [autoWrap(), react()]

// ❌ Wrong — JSX is already transpiled when autoWrap runs
plugins: [react(), autoWrap()]
```

### Why order matters

The plugin uses `enforce: 'pre'` to run before `@vitejs/plugin-react`:

1. **`autoWrap()` runs first** — processes `.jsx`/`.tsx` files while JSX syntax is intact
2. **React plugin runs** — converts JSX to `React.createElement()` calls
3. **esbuild bundles** — produces the final output

If `react()` runs before `autoWrap()`, the JSX is already converted to function calls and the plugin cannot find JSX expressions to wrap.

---

## Configuration

All options from `@usels/babel-plugin-legend-memo` are supported:

```typescript
interface PluginOptions {
  /**
   * Wrapper component name
   * @default "Memo"
   */
  componentName?: string;

  /**
   * Import source for the wrapper component
   * @default "@legendapp/state/react"
   */
  importSource?: string;

  /**
   * Detect all .get() calls regardless of $ suffix
   * @default false
   */
  allGet?: boolean;

  /**
   * Additional method names to detect beyond "get"
   * @default ["get"]
   */
  methodNames?: string[];

  /**
   * Additional reactive component names to skip
   * Merged with defaults: Auto, For, Show, Memo, Computed, Switch
   */
  reactiveComponents?: string[];

  /**
   * Observer HOC function names — skip content inside these
   * @default ["observer"]
   */
  observerNames?: string[];

  /**
   * Auto-wrap non-function children of Memo/Show/Computed in () =>
   * Replaces the need for @legendapp/state/babel plugin
   * @default true
   */
  wrapReactiveChildren?: boolean;

  /**
   * Additional component names whose children should be auto-wrapped
   * Merged with defaults: Memo, Show, Computed
   */
  wrapReactiveChildrenComponents?: string[];
}
```

---

## Features

### 1. Auto-wrap `.get()` calls in JSX expressions

```tsx
// Input
<div>{count$.get()}</div>

// Output
import { Memo } from "@legendapp/state/react";
<div><Memo>{() => count$.get()}</Memo></div>
```

Complex expressions, ternaries, and conditionals are all handled:

```tsx
// Multiple observables → one Memo
<p>{a$.get() + " " + b$.get()}</p>
// → <p><Memo>{() => a$.get() + " " + b$.get()}</Memo></p>

// Ternary
<div>{isActive$.get() ? "ON" : "OFF"}</div>
// → <div><Memo>{() => isActive$.get() ? "ON" : "OFF"}</Memo></div>

// Conditional rendering
<div>{show$.get() && <Modal />}</div>
// → <div><Memo>{() => show$.get() && <Modal />}</Memo></div>
```

### 2. Auto-wrap `.get()` calls in JSX attributes

When an element's props contain `.get()`, the entire element is wrapped:

```tsx
// Input
<Component value={obs$.get()} />

// Output
<Memo>{() => <Component value={obs$.get()} />}</Memo>
```

Attributes and children together → one `<Memo>`:

```tsx
// Input
<div className={theme$.get()}>
  {count$.get()}
</div>

// Output
<Memo>{() =>
  <div className={theme$.get()}>
    {count$.get()}
  </div>
}</Memo>
```

### 3. Auto-wrap children of Memo/Show/Computed

Non-function children are automatically wrapped in `() =>`. This replaces `@legendapp/state/babel`:

```tsx
// Input
<Memo>{count$.get()}</Memo>
<Show if={cond$}>{count$.get()}</Show>
<Computed>{price$.get() * qty$.get()}</Computed>

// Output
<Memo>{() => count$.get()}</Memo>
<Show if={cond$}>{() => count$.get()}</Show>
<Computed>{() => price$.get() * qty$.get()}</Computed>
```

Direct JSX children and multiple children:

```tsx
// Direct JSX child
<Memo><div>{count$.get()}</div></Memo>
// → <Memo>{() => <div>{count$.get()}</div>}</Memo>

// Multiple children → Fragment
<Memo><Header /><Body /></Memo>
// → <Memo>{() => <><Header /><Body /></>}</Memo>
```

---

## Writing Components

### Basic principle: write `.get()` naturally, plugin handles wrapping

```tsx
import { observable } from '@legendapp/state';
import { Show, Memo, For } from '@legendapp/state/react';

const count$ = observable(0);
const isVisible$ = observable(true);
const user$ = observable({ name: 'Alice', age: 30 });
const items$ = observable([{ id: 1, name: 'Item 1' }]);

export function App() {
  return (
    <div>
      {/* Simple expressions — plugin wraps each */}
      <h1>Count: {count$.get()}</h1>
      <p>User: {user$.name.get()}</p>

      {/* Memo children — plugin auto-wraps in () => */}
      <Memo>
        <div className="card">{count$.get()}</div>
      </Memo>

      {/* Show children — plugin auto-wraps in () => */}
      <Show if={isVisible$}>
        {user$.name.get()}
      </Show>

      {/* For — handles list reactivity, plugin skips inside */}
      <For each={items$}>
        {(item$) => <li>{item$.name.get()}</li>}
      </For>
    </div>
  );
}
```

### Use `$` suffix for observables (required by default)

```tsx
// ✅ Detected automatically — use $ suffix
const count$ = observable(0);
const profile$ = observable({ name: '', email: '' });

// ❌ Without $ — won't be wrapped (use allGet: true to override)
const count = observable(0);
```

### Use `observer()` for component-level reactivity

When the whole component is reactive, wrap with `observer()`. Plugin skips content inside — no double-wrapping:

```tsx
import { observer } from '@legendapp/state/react';

// ✅ Entire component is reactive — no individual Memo wrappers needed
const Profile = observer(() => {
  return (
    <div>
      <h2>{user$.name.get()}</h2>
      <p>{user$.bio.get()}</p>
      <span>{user$.age.get()} years old</span>
    </div>
  );
});
```

**When to use `observer()`:** When the entire component needs reactivity and you want simpler code without individual `<Memo>` boundaries.

**When to use auto-wrap (default):** When you want fine-grained reactivity — only the specific expressions that use observables update, not the whole component.

### Reactive attributes

```tsx
const theme$ = observable({ color: '#007bff', size: 'lg' });
const isDark$ = observable(false);

function ThemedButton({ label }: { label: string }) {
  return (
    <button
      className={`btn-${theme$.size.get()}`}
      style={{ backgroundColor: theme$.color.get() }}
      aria-pressed={isDark$.get()}
    >
      {label}
    </button>
    // ↑ Plugin wraps entire <button> since attributes have .get()
  );
}
```

### Conditional rendering patterns

```tsx
const auth$ = observable({ isLoggedIn: false, username: '' });

function Header() {
  return (
    <header>
      {/* Show removes from DOM when false */}
      <Show if={auth$.isLoggedIn}>
        {/* Plugin auto-wraps children */}
        Welcome, {auth$.username.get()}
      </Show>

      {/* Ternary with .get() */}
      <nav>
        {auth$.isLoggedIn.get()
          ? <a href="/profile">Profile</a>
          : <a href="/login">Login</a>
        }
      </nav>
    </header>
  );
}
```

### Reactive lists with `For`

```tsx
const todos$ = observable([
  { id: 1, text: 'Learn Legend-State', done: false },
]);

function TodoList() {
  return (
    <ul>
      <For each={todos$}>
        {(todo$) => (
          // item$ is already reactive — plugin skips inside For
          <li
            style={{ textDecoration: todo$.done.get() ? 'line-through' : 'none' }}
          >
            {todo$.text.get()}
          </li>
        )}
      </For>
    </ul>
  );
}
```

### Computed derived values

```tsx
import { computed } from '@legendapp/state';

const price$ = observable(100);
const qty$ = observable(2);
const discount$ = observable(0.1);

// Derived value
const total$ = computed(() =>
  price$.get() * qty$.get() * (1 - discount$.get())
);

function OrderSummary() {
  return (
    <div>
      <p>Price: {price$.get()}</p>
      <p>Qty: {qty$.get()}</p>
      <p>Total: {total$.get()}</p>
      {/* Plugin wraps each expression individually */}
    </div>
  );
}
```

---

## API Reference

### `autoWrap(options?: PluginOptions): Plugin`

Returns a Vite plugin that transforms `.jsx` and `.tsx` files using `@usels/babel-plugin-legend-memo`.

**Parameters:**
- `options` (optional) — Configuration object. See [Configuration](#configuration).

**Returns:** Vite `Plugin` object

**Example:**

```typescript
import { autoWrap } from '@usels/vite-plugin-legend-memo';

const plugin = autoWrap({
  componentName: 'Memo',
  importSource: '@legendapp/state/react',
  wrapReactiveChildren: true,
});
```

### Type exports

```typescript
import type { PluginOptions } from '@usels/vite-plugin-legend-memo';

const options: PluginOptions = {
  allGet: false,
  wrapReactiveChildren: true,
};
```

---

## Troubleshooting

### `.get()` calls aren't being wrapped

1. Check plugin order — `autoWrap()` must come before `react()`
2. Check that your observable uses `$` suffix (or enable `allGet: true`)
3. Check if code is inside `observer()` — this is intentional (observer makes whole component reactive)

```typescript
// Check 1: plugin order
plugins: [autoWrap(), react()]  // ✅ correct order

// Check 2: $ suffix
const count$ = observable(0);  // ✅ will be wrapped
const count = observable(0);   // ❌ won't be wrapped (add allGet: true)

// Check 3: observer() is expected
const Comp = observer(() => {
  return <div>{count$.get()}</div>;  // intentionally not wrapped
});
```

### `Memo` is not defined error

The plugin auto-adds `import { Memo } from "@legendapp/state/react"` when wrapping. If you see this error:

1. Ensure `@legendapp/state` is installed: `npm install @legendapp/state`
2. If using a different import source, configure it: `autoWrap({ importSource: '...' })`

### Source maps not working

The plugin preserves source maps automatically. If DevTools shows incorrect locations:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true,  // Enable for production builds
  },
});
```

### Performance: too many re-renders

If you see many components re-rendering, consider using `observer()` for entire components instead of fine-grained `<Memo>` boundaries:

```tsx
// Fine-grained (default) — each expression gets its own Memo
function Component() {
  return <div>{a$.get()} {b$.get()} {c$.get()}</div>;
}

// Component-level (use observer if whole component should update together)
const Component = observer(() => {
  return <div>{a$.get()} {b$.get()} {c$.get()}</div>;
});
```

---

## Peer Dependencies

| Package | Required Version |
|---------|-----------------|
| `vite` | `>=4.0.0` |
| `@babel/core` | `>=7.0.0` |
| `@usels/babel-plugin-legend-memo` | `workspace:*` |

---

## See Also

- [@usels/babel-plugin-legend-memo](../babel) — The underlying Babel plugin and its full documentation
- [Legend-State Documentation](https://legendapp.com/dev/state/v3/)
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
