# prefer-for-component

Prefer `<For>` component over `.map()` on observable arrays in JSX for fine-grained reactivity.

## Rule Details

When you call `.get()` on an observable array and then `.map()` over the result, the entire parent component re-renders every time the array changes — even if only one item changed. Legend-State's `<For>` component tracks changes at the individual item level, re-rendering only the affected items.

### Incorrect

```tsx
// ❌ Entire parent re-renders when any item changes
{items$.get().map((item) => (
  <li key={item.id}>{item.name}</li>
))}

// ❌ Direct .map() on observable (also semantically wrong)
{items$.map((item$) => (
  <li key={item$.id.get()}>{item$.name.get()}</li>
))}
```

### Correct

```tsx
// ✅ Only changed items re-render
<For each={items$}>
  {(item$) => <li>{item$.name.get()}</li>}
</For>

// ✅ With optimized item component
<For each={items$} item={ItemComponent} />

// ✅ Optimized rendering with optimized prop
<For each={items$} optimized>
  {(item$) => <li>{item$.name.get()}</li>}
</For>
```

## Detection Strategy

The rule flags a `JSXExpressionContainer` containing a `.map()` call when:

1. The object being mapped is:
   - A `$`-suffixed `Identifier` (e.g. `items$`), or
   - A direct `.get()` / `.peek()` call on a `$`-suffixed object (e.g. `items$.get()`)
2. The `.map()` callback is an **arrow function with an implicit JSX return** (v1 scope).
3. When `requireKeyProp: true` (default `false`), the returned JSX element has a `key` prop.
4. The expression is **not** already inside a `<For>` component.

**Not flagged in v1** (known limitations):
```tsx
// Block body — v1 does not detect this
{items$.get().map((item) => {
  return <li key={item.id} />;
})}

// Reference callback — v1 does not detect
{items$.get().map(renderItem)}

// Filter chain — v1 does not detect
{items$.get().filter(Boolean).map((item) => <li key={item.id} />)}
```

## Options

```ts
{
  "use-legend/prefer-for-component": ["warn", {
    "forComponents": ["For"],
    "requireKeyProp": false
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `forComponents` | `string[]` | `["For"]` | Component names considered as `<For>` equivalents (suppresses warning inside them). |
| `forImportSources` | `string[]` | `["@legendapp/state/react"]` | Import sources for `forComponents` (currently informational). |
| `requireKeyProp` | `boolean` | `false` | When `true`, only flag `.map()` calls whose callback returns JSX with a `key` prop. |

## Notes

- Accuracy is highest when [`observable-naming`](./observable-naming.md) is active.
- The `$` suffix is used as the sole proxy for "is this an observable?" — no type analysis is performed.

## Related Rules

- [`prefer-show-for-conditional`](./prefer-show-for-conditional.md) — Fine-grained alternative for conditional rendering.
- [`no-reactive-hoc`](./no-reactive-hoc.md) — Discourages whole-component reactive wrappers.
- [`observable-naming`](./observable-naming.md) — Required for accurate detection.
