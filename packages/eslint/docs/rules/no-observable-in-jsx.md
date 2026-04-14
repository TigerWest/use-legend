# no-observable-in-jsx

Disallow rendering observables as JSX text nodes.

## Rule Details

Placing an observable directly as a JSX child (`<div>{count$}</div>`) renders `[object Object]` instead of the actual value. This is a silent bug — no runtime error is thrown, but the UI displays garbage. This rule catches these cases at lint time.

The rule only checks JSX child positions. Prop values are intentionally not checked — TypeScript already verifies type compatibility, and some props accept observables by design (`Show#if`, `For#each`, `ref` from `useRef$`, `*$`-suffixed custom props, etc.).

### Incorrect

```tsx
// ❌ Renders "[object Object]"
<div>{count$}</div>

// ❌ Nested property — still an observable, not a value
<span>{user$.name}</span>

// ❌ Raw observable as child of a reactive component
<Show>{obs$}</Show>
<Computed>{obs$}</Computed>
```

### Correct

```tsx
// ✅ Call .get() to read the value
<div>{count$.get()}</div>
<span>{user$.name.get()}</span>

// ✅ Reactive components receive a render function, not the raw observable
<Memo>{() => count$.get()}</Memo>
<Computed>{() => obs$.get()}</Computed>

// ✅ Props are not checked — type compatibility is handled by TypeScript
<Show if={isLoading$}><Spinner /></Show>
<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>
<CustomComp value={counter$} />
<div ref={el$} />
```

## Options

This rule has no options.

## Detection Strategy

The rule detects observable expressions by checking if the expression is:
- An `Identifier` whose name ends with `$`, or
- A `MemberExpression` where the root object's name ends with `$`.

Detection relies on the `$` suffix naming convention. Enable [`observable-naming`](./observable-naming.md) to ensure all observables are consistently named.

## Related Rules

- [`observable-naming`](./observable-naming.md) — Ensures observables are named with `$` suffix (required for accurate detection).
- [`prefer-show-for-conditional`](./prefer-show-for-conditional.md) — Catches `{obs$ && <A />}` patterns.
