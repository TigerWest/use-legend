# observable-naming

Require variables holding observables to end with `$`.

## Rule Details

Observable values returned from Legend-State APIs (`observable()`, `computed()`, `useObservable()`, etc.) should be stored in variables whose names end with `$`. This convention makes observables immediately identifiable in code and prevents accidentally treating them as plain values.

### Incorrect

```ts
// ❌ Missing $ suffix
const count = useObservable(0);
const isLoading = useObservable(false);
const data = observable({ name: 'foo' });
const total = computed(() => count.get() + 1);
```

### Correct

```ts
// ✅ $ suffix applied
const count$ = useObservable(0);
const isLoading$ = useObservable(false);
const data$ = observable({ name: 'foo' });
const total$ = computed(() => count$.get() + 1);
```

## Exceptions

The rule does **not** flag:

- **Destructuring patterns** — handled by [`hook-return-naming`](./hook-return-naming.md) instead.
- **`for...of` loop variables** — iteration variables are excluded.
- **Array destructuring** (`const [count$] = useState(...)`) — excluded.
- Variables matching `allowPattern` option.

```ts
// ✅ Destructuring — not flagged here
const { x$, isDragging$ } = useDraggable(target$);

// ✅ for...of — not flagged
for (const item of useObservable([])) { /* ... */ }
```

## Options

```ts
{
  "use-legend/observable-naming": ["error", {
    "trackFunctions": {
      "@legendapp/state": ["observable", "computed"],
      "@legendapp/state/react": ["useObservable", "useObservableState"],
      "@usels/core": []   // empty array = track all exported use* hooks
    },
    "allowPattern": null  // e.g. "^_" to allow underscore-prefixed names
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trackFunctions` | `Record<string, string[]>` | See above | Map of import source to function names to track. Empty array tracks all named exports. |
| `allowPattern` | `string \| null` | `null` | Regex pattern; matching variable names are exempt. |

## When Not to Use This Rule

Disable this rule if your project does not follow the `$` suffix naming convention for observables.

## Related Rules

- [`hook-return-naming`](./hook-return-naming.md) — Enforces `$` suffix preservation in destructuring.
- [`no-observable-in-jsx`](./no-observable-in-jsx.md) — Prevents raw observable usage in JSX (requires `$` suffix to detect).
- [`prefer-show-for-conditional`](./prefer-show-for-conditional.md) — Accuracy is highest when this rule is active.
- [`prefer-for-component`](./prefer-for-component.md) — Accuracy is highest when this rule is active.
