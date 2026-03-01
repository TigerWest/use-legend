# hook-return-naming

Require `$` suffix to be preserved when renaming destructured observable fields.

## Rule Details

When destructuring the return value of a hook that includes `$`-suffixed fields (observables), renaming those fields without preserving the `$` suffix hides the observable nature of the value. This leads to subtle bugs when the renamed variable is later used without `.get()`.

### Incorrect

```ts
// ❌ $ suffix removed during rename
const { x$: x, isDragging$: dragging } = useDraggable(target$);
const { files$: files } = useDropZone(target$);
const { scroll$: position } = useScroll(el$);
```

### Correct

```ts
// ✅ Keep shorthand — no rename needed
const { x$, isDragging$ } = useDraggable(target$);

// ✅ Rename preserving $ suffix
const { x$: posX$, isDragging$: dragging$ } = useDraggable(target$);
const { files$: uploadedFiles$ } = useDropZone(target$);

// ✅ Non-$ fields can be renamed freely
const { stop, pause, isActive$: active$ } = useIntersectionObserver(el$, cb);
```

## Options

```ts
{
  "use-legend/hook-return-naming": ["warn", {
    "enforceOnAllDestructuring": true
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enforceOnAllDestructuring` | `boolean` | `true` | When `true`, checks all object destructuring. When `false`, only checks destructuring of function call results. |

## When Not to Use This Rule

- If your project allows renaming observables without the `$` suffix (not recommended).
- If you use `enforceOnAllDestructuring: false` and need to destructure plain objects with `$`-suffixed keys.

## Related Rules

- [`observable-naming`](./observable-naming.md) — Enforces `$` suffix on observable variable declarations.
- [`no-observable-in-jsx`](./no-observable-in-jsx.md) — Catches renamed observables that are then used in JSX without `.get()`.
