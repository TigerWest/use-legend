# no-observable-in-jsx

Disallow using observables directly in JSX expressions without calling `.get()`.

## Rule Details

Placing an observable directly inside a JSX expression (`{count$}`) renders `[object Object]` instead of the actual value. This is a silent bug — no runtime error is thrown, but the UI displays garbage. This rule catches these cases at lint time.

### Incorrect

```tsx
// ❌ Renders "[object Object]"
<div>{count$}</div>

// ❌ Nested property — still an observable, not a value
<span>{user$.name}</span>

// ❌ Logical expression with raw observable
{isLoading$ && <Spinner />}

// ❌ Observable passed as a non-allowed prop
<Button disabled={isDisabled$} />
```

### Correct

```tsx
// ✅ Call .get() to read the value
<div>{count$.get()}</div>
<span>{user$.name.get()}</span>

// ✅ Legend-State reactive components accept observables intentionally
<Show if={isLoading$}><Spinner /></Show>
<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>
<Switch value={tab$}><Match when="home"><Home /></Match></Switch>

// ✅ ref prop accepts observable refs from useRef$
<div ref={el$} />

// ✅ Memo child — observable passed into a reactive render function
<Memo>{() => count$.get()}</Memo>
```

## Allowed Components & Props

By default these Legend-State components accept observables in specific props:

| Component | Allowed Props |
|-----------|--------------|
| `Show` | `if`, `ifReady`, `else` |
| `For` | `each` |
| `Switch` | `value` |
| `Memo`, `Computed` | (as children container) |

Additionally, the `ref` prop is always allowed on any element (for `useRef$` observable refs).

## Options

```ts
{
  "use-legend/no-observable-in-jsx": ["error", {
    "allowedJsxComponents": ["Show", "For", "Switch", "Memo", "Computed"],
    "allowedProps": {
      "Show": ["if", "ifReady", "else"],
      "For": ["each"],
      "Switch": ["value"]
    },
    "allowedGlobalProps": ["ref"]
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowedJsxComponents` | `string[]` | `["Show","For","Switch","Memo","Computed"]` | Components whose children may receive observables. |
| `allowedProps` | `Record<string, string[]>` | See above | Per-component prop allowlist. |
| `allowedGlobalProps` | `string[]` | `["ref"]` | Props allowed on any element. |

## Detection Strategy

The rule detects observable expressions by checking if the expression is:
- An `Identifier` whose name ends with `$`, or
- A `MemberExpression` where the root object's name ends with `$`.

Detection relies on the `$` suffix naming convention. Enable [`observable-naming`](./observable-naming.md) to ensure all observables are consistently named.

## Related Rules

- [`observable-naming`](./observable-naming.md) — Ensures observables are named with `$` suffix (required for accurate detection).
- [`prefer-show-for-conditional`](./prefer-show-for-conditional.md) — Catches `{obs$ && <A />}` patterns.
