# @usels/babel-plugin-legend-memo

A Babel plugin that automatically wraps Legend-State observable `.get()` calls in JSX with reactive `<Memo>` boundaries — and also auto-wraps children of `Memo`/`Show`/`Computed` components.

```jsx
// You write this
<div>{count$.get()}</div>

// Plugin transforms to
import { Memo } from "@usels/core";
<div><Memo>{() => count$.get()}</Memo></div>
```

**One plugin replaces two** — no longer need `@legendapp/state/babel` separately.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Setup](#setup)
- [How It Works](#how-it-works)
  - [Feature 1: Auto-wrap `.get()` in JSX expressions](#feature-1-auto-wrap-get-in-jsx-expressions)
  - [Feature 2: Auto-wrap `.get()` in JSX attributes](#feature-2-auto-wrap-get-in-jsx-attributes)
  - [Feature 3: Auto-wrap children of Memo/Show/Computed](#feature-3-auto-wrap-children-of-memoshowcomputed)
- [Skip Cases](#skip-cases)
- [Plugin Options](#plugin-options)
- [Writing Components](#writing-components)
- [Migration Guide](#migration-guide)
- [Common Patterns](#common-patterns)
- [FAQ](#faq)

---

## Features

1. **Auto-wraps JSX expressions** — `{count$.get()}` → `<Memo>{() => count$.get()}</Memo>`
2. **Auto-wraps JSX attributes** — element with `.get()` in props → entire element wrapped in `<Memo>`
3. **Auto-wraps reactive children** — `<Memo>{expr}</Memo>` → `<Memo>{() => expr}</Memo>` (replaces `@legendapp/state/babel`)
4. **Auto-adds import** — `import { Memo } from "@legendapp/state/react"` added automatically
5. **Source-aware boundaries** — generated `Memo` boundaries can nest when child JSX reads different sources
6. **Safe detection** — only wraps `$`-suffixed observables by default, skips `Map.get('key')`
7. **Supports optional chaining** — `obs$?.get()` and `obs$.items[0].get()` detected correctly
8. **Respects manual Memo** — user-authored `<Memo>` is treated as an explicit boundary; only its children are normalized to a function

---

## Installation

```bash
npm install -D @usels/babel-plugin-legend-memo
# or
pnpm add -D @usels/babel-plugin-legend-memo
# or
yarn add -D @usels/babel-plugin-legend-memo
```

**Peer dependency required:**

```bash
npm install -D @babel/core
```

---

## Setup

### babel.config.js

```js
module.exports = {
  plugins: ['@usels/babel-plugin-legend-memo'],
};
```

### .babelrc

```json
{
  "plugins": ["@usels/babel-plugin-legend-memo"]
}
```

### With options

```js
module.exports = {
  plugins: [
    ['@usels/babel-plugin-legend-memo', {
      componentName: 'Memo',
      importSource: '@legendapp/state/react',
      allGet: false,
      wrapReactiveChildren: true,
    }]
  ],
};
```

---

## How It Works

### Feature 1: Auto-wrap `.get()` in JSX expressions

When a JSX expression contains a `$`-suffixed observable `.get()` call, the plugin wraps it in `<Memo>{() => ...}</Memo>` and automatically adds the import.

```jsx
// Input
function App() {
  return (
    <div>
      {count$.get()}
      <span>{user$.profile.name.get()}</span>
    </div>
  );
}

// Output
import { Memo } from "@usels/core";
function App() {
  return (
    <div>
      <Memo>{() => count$.get()}</Memo>
      <span>
        <Memo>{() => user$.profile.name.get()}</Memo>
      </span>
    </div>
  );
}
```

Multiple `.get()` calls in an unsplittable expression are wrapped together:

```jsx
// Input
<p>{a$.get() + " " + b$.get()}</p>

// Output
<p><Memo>{() => a$.get() + " " + b$.get()}</Memo></p>
```

Ternary and conditional expressions split branch reads when that preserves render semantics:

```jsx
// Input
<div>{isActive$.get() ? "ON" : "OFF"}</div>
<div>{show$.get() && <Modal />}</div>
<div>{isVisible$.get() ? <A /> : <B />}</div>

// Output
<div><Memo>{() => isActive$.get() ? "ON" : "OFF"}</Memo></div>
<div><Memo>{() => show$.get() && <Modal />}</Memo></div>
<div><Memo>{() => isVisible$.get() ? <A /> : <B />}</Memo></div>
```

When a condition and its branches read different sources, the condition becomes the outer boundary and each reactive branch can get its own nested boundary:

```jsx
// Input
<div>{a$.get() ? b$.get() : c$.get()}</div>

// Output
<div>
  <Memo>
    {() => (a$.get() ? <Memo>{() => b$.get()}</Memo> : <Memo>{() => c$.get()}</Memo>)}
  </Memo>
</div>
```

---

### Feature 2: Auto-wrap `.get()` in JSX attributes

When a JSX element has `.get()` in its props, the **entire element** is wrapped in `<Memo>`:

```jsx
// Input — single attribute
<Component value={obs$.get()} />

// Output
import { Memo } from "@usels/core";
<Memo>{() => <Component value={obs$.get()} />}</Memo>
```

Multiple attributes with `.get()` are wrapped together in one `<Memo>`:

```jsx
// Input — multiple attributes
<Component value={obs$.get()} label={name$.get()} />

// Output
<Memo>{() => <Component value={obs$.get()} label={name$.get()} />}</Memo>
```

Attributes + children together — the element is wrapped for the prop source, and child reads can keep their own boundary when they read a different source:

```jsx
// Input
<div className={theme$.get()}>
  {count$.get()}
</div>

// Output
<Memo>{() =>
  <div className={theme$.get()}>
    <Memo>{() => count$.get()}</Memo>
  </div>
}</Memo>
```

---

### Feature 3: Auto-wrap children of Memo/Show/Computed

Non-function children of `Memo`, `Show`, and `Computed` are automatically wrapped in `() =>`. This is equivalent to the `@legendapp/state/babel` plugin behavior.

```jsx
// Input
<Memo>{count$.get()}</Memo>
<Show if={cond$}>{count$.get()}</Show>
<Computed>{count$.get()}</Computed>

// Output (no new import needed — Memo/Show/Computed are user-imported)
<Memo>{() => count$.get()}</Memo>
<Show if={cond$}>{() => count$.get()}</Show>
<Computed>{() => count$.get()}</Computed>
```

Direct JSX element children:

```jsx
// Input
<Memo><div>hello</div></Memo>
<Memo><span>{count$.get()}</span></Memo>

// Output
<Memo>{() => <div>hello</div>}</Memo>
<Memo>{() => <span>{count$.get()}</span>}</Memo>
```

Multiple children → wrapped in Fragment:

```jsx
// Input
<Memo>
  <Header />
  <Body />
</Memo>

// Output
<Memo>{() => <><Header /><Body /></>}</Memo>
```

Combined — `Show` with `.get()` attribute AND children:

```jsx
// Input
<Show if={obs$.get()}>{count$.get()}</Show>

// Output
import { Memo } from "@usels/core";
<Memo>{() => <Show if={obs$.get()}>{() => count$.get()}</Show>}</Memo>
// ↑ children wrapped first, then whole element wrapped for attribute
```

#### Manual Memo policy

User-authored `<Memo>` is treated as a manual render boundary. The plugin still normalizes non-function children to `() =>`, but it does not create additional generated `Memo` boundaries inside that manual `Memo`.

```jsx
// Input
<Memo>
  <>
    <span>{count$.get()}</span>
    <strong>{total$.get()}</strong>
  </>
</Memo>

// Output
<Memo>
  {() => (
    <>
      <span>{count$.get()}</span>
      <strong>{total$.get()}</strong>
    </>
  )}
</Memo>
```

This preserves the scope the user chose. It also means a broad manual `Memo` groups all reads inside that boundary. If fine-grained rendering is more important, either let the plugin generate the boundaries or keep manual `Memo` scopes narrow.

```jsx
// Input
<Memo>{a$.get() ? b$.get() : c$.get()}</Memo>

// Output: children are normalized, but branches are not split inside manual Memo
<Memo>{() => a$.get() ? b$.get() : c$.get()}</Memo>
```

---

## Skip Cases

The plugin intentionally skips these cases:

| Case | Example | Reason |
|------|---------|--------|
| `.get()` with arguments | `map.get('key')` | `Map.prototype.get` takes args |
| No `$` suffix | `store.get()` | Not a Legend-State observable (use `allGet: true` to override) |
| Inside user-authored `Memo` | `<Memo>{() => count$.get()}</Memo>` | Manual `Memo` is an explicit boundary; children normalization still applies |
| Inside `observer()` HOC | `observer(() => <div>{obs$.get()}</div>)` | Whole component is reactive |
| Already a function child | `<Memo>{() => ...}</Memo>` | Already wrapped |
| Identifier/reference child | `<Memo>{renderFn}</Memo>` | Function reference — already correct |
| `key` prop | `<li key={item$.id.get()}>` | React reconciliation requires literal key |
| `ref` prop | `<div ref={domRef$.get()}>` | DOM ref, not a reactive value |
| Inside event handler | `onClick={() => obs$.set(...)}` | Lazy callback — shouldn't be reactive boundary |
| Inside `useMemo`/`useCallback` | `useMemo(() => obs$.get(), [])` | Hook internals — not JSX expressions |

---

## Plugin Options

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
   * Additional component names to treat as user-authored opaque reactive boundaries
   */
  reactiveComponents?: string[];

  /**
   * Observer HOC function names — skip content inside these
   * @default ["observer"]
   */
  observerNames?: string[];

  /**
   * Auto-wrap non-function children of Memo/Show/Computed in () =>
   * Equivalent to @legendapp/state/babel plugin behavior
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

### Examples

```js
// Custom wrapper component (e.g., using @usels/core)
['@usels/babel-plugin-legend-memo', {
  componentName: 'Auto',
  importSource: '@usels/core',
}]

// Detect all .get() regardless of $ suffix
['@usels/babel-plugin-legend-memo', {
  allGet: true,
}]

// Disable Memo/Show/Computed children wrapping
['@usels/babel-plugin-legend-memo', {
  wrapReactiveChildren: false,
}]

// Add custom reactive components to treat as manual boundaries
['@usels/babel-plugin-legend-memo', {
  reactiveComponents: ['MyObserver', 'ReactiveContainer'],
}]

// Add custom components whose children should be auto-wrapped
['@usels/babel-plugin-legend-memo', {
  wrapReactiveChildrenComponents: ['MyMemo', 'CustomComputed'],
}]
```

---

## Writing Components

### ✅ Do: Write `.get()` naturally in JSX

```tsx
// Just use .get() — plugin handles the reactive boundary
function Counter() {
  return (
    <div>
      <p>Count: {count$.get()}</p>
      <p>User: {user$.name.get()}</p>
      <p>Status: {isActive$.get() ? "Active" : "Inactive"}</p>
    </div>
  );
}
```

### ✅ Do: Use `$` suffix for observables

```tsx
// The $ suffix is required for auto-detection (default behavior)
const count$ = observable(0);
const user$ = observable({ name: 'Alice' });
const items$ = observable([]);
```

### ✅ Do: Use Memo/Show/Computed freely — no need to write `() =>`

```tsx
// The plugin auto-wraps children
function App() {
  return (
    <>
      <Memo>{count$.get()}</Memo>

      <Show if={isVisible$}>
        {content$.get()}
      </Show>

      <Computed>
        {price$.get() * qty$.get()}
      </Computed>

      {/* Direct JSX children work too */}
      <Memo>
        <div className="card">{count$.get()}</div>
      </Memo>
    </>
  );
}
```

### ✅ Do: Use `observer()` for fully-reactive components

```tsx
// observer() makes the whole component reactive
// Plugin skips .get() calls inside observer — no double-wrapping
const MyComponent = observer(() => {
  return (
    <div>
      <h2>{user$.name.get()}</h2>
      <p>{user$.bio.get()}</p>
    </div>
  );
});
```

### ✅ Do: Use `For` for reactive lists

```tsx
// For handles list mapping. JSX returned from the item renderer is still eligible
// for source-aware Memo wrapping unless it is inside a manual Memo or observer().
<For each={items$}>
  {(item$) => (
    <li key={item$.id.get()}>
      {item$.name.get()}
    </li>
  )}
</For>
```

### ✅ Do: Keep manual `<Memo>` boundaries narrow when you need them

```tsx
// Manual Memo is respected as a boundary.
// The plugin will normalize children to () => but won't split inside it.
<Memo>
  <PriceRow price$={price$} total$={total$} />
</Memo>
```

### ❌ Don't: Manually add broad `<Memo>` around expressions the plugin can handle

```tsx
// ❌ Redundant, and it groups both reads into one manual boundary
<div>
  <Memo>
    {count$.get()} / {total$.get()}
  </Memo>
</div>

// ✅ Just write the expression
<div>
  {count$.get()} / {total$.get()}
</div>
```

### ✅ Prefer: Let the plugin add `() =>` inside Memo/Show/Computed

```tsx
// Redundant — plugin auto-wraps children
<Memo>{() => count$.get()}</Memo>

// Prefer this unless you are intentionally passing a function/reference child
<Memo>{count$.get()}</Memo>
```

### ❌ Don't: Use `.get()` in `key` prop

```tsx
// ❌ Plugin can't wrap key prop — key must be on the outermost element
items.map(item$ => <li key={item$.id.get()}>{item$.name.get()}</li>)

// ✅ Use For instead — handles keys automatically
<For each={items$}>
  {(item$) => <li>{item$.name.get()}</li>}
</For>
```

---

## Migration Guide

### From manual `<Memo>` wrapping

Before:
```tsx
function App() {
  return (
    <div>
      <Memo>{() => count$.get()}</Memo>
      <Memo>{() => user$.name.get()}</Memo>
    </div>
  );
}
```

After (let the plugin handle it):
```tsx
function App() {
  return (
    <div>
      {count$.get()}
      {user$.name.get()}
    </div>
  );
}
```

### From `@legendapp/state/babel` + another plugin

Before (two plugins):
```js
// babel.config.js
module.exports = {
  plugins: [
    "@legendapp/state/babel",     // Memo/Show/Computed children wrapping
    "some-other-plugin",          // .get() auto-wrapping
  ],
};
```

After (one plugin):
```js
module.exports = {
  plugins: [
    "@usels/babel-plugin-legend-memo",     // Both features included
  ],
};
```

---

## Common Patterns

### Counter with increment button

```tsx
const count$ = observable(0);

function Counter() {
  return (
    <div>
      <p>Count: {count$.get()}</p>
      <button onClick={() => count$.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
// Plugin wraps {count$.get()} — button handler is NOT wrapped (inside function)
```

### Conditional display with Show

```tsx
const isLoggedIn$ = observable(false);
const username$ = observable('');

function Header() {
  return (
    <header>
      <Show if={isLoggedIn$}>
        Welcome, {username$.get()}!
      </Show>
      <Show if={() => !isLoggedIn$.get()}>
        <a href="/login">Login</a>
      </Show>
    </header>
  );
}
```

### Reactive form fields

```tsx
const formData$ = observable({ name: '', email: '' });

function Form() {
  return (
    <form>
      <input
        value={formData$.name.get()}
        onChange={e => formData$.name.set(e.target.value)}
      />
      {/* Plugin wraps entire <input> since value attr has .get() */}
    </form>
  );
}
```

### Reactive styles

```tsx
const theme$ = observable({ primary: '#007bff', isDark: false });

function ThemedButton() {
  return (
    <button
      style={{
        backgroundColor: theme$.primary.get(),
        color: theme$.isDark.get() ? 'white' : 'black',
      }}
    >
      Click me
    </button>
    // Plugin wraps entire button since style attribute has .get()
  );
}
```

---

## FAQ

**Q: Does this work with TypeScript?**
A: Yes, the plugin processes TypeScript JSX files. Ensure `@babel/plugin-syntax-jsx` is included (or use the Vite plugin which handles this automatically).

**Q: What about `obs$?.get()` optional chaining?**
A: Supported — detected and wrapped correctly.

**Q: What if I don't use the `$` suffix?**
A: Enable `allGet: true` in options to detect all `.get()` calls regardless of variable name.

**Q: Is there a risk of infinite loops from re-visiting wrapped nodes?**
A: No — after wrapping, the visitor sees `{() => ...}` which is already a function and skips it.

**Q: Does this work with `observer()` HOC from `@legendapp/state/react`?**
A: Yes — the plugin detects `observer()` wrappers and skips content inside them.

**Q: What happens with `<For>` components?**
A: `For` is in the default reactive components list — content inside `For` is skipped (not wrapped).

**Q: Can I use a custom component instead of `Memo`?**
A: Yes — use `componentName` and `importSource` options.
