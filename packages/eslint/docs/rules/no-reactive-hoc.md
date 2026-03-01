# no-reactive-hoc

Warn against using reactive HOCs (`observer`, `reactive`, `reactiveObserver`). Use `<Show>`, `<For>`, or `<Memo>` for fine-grained reactivity instead.

## Rule Details

Higher-Order Components like `observer()` and `reactive()` wrap the **entire component** in a reactive observer, causing the whole component to re-render whenever any observable it reads changes. This is contrary to Legend-State's fine-grained reactivity philosophy, where only the smallest affected DOM node should update.

### Incorrect

```tsx
import { observer, reactive, reactiveObserver } from '@legendapp/state/react';

// ❌ Whole-component re-render on any observable change
const MyComponent = observer(() => {
  return <div>{count$.get()}</div>;
});

// ❌ Makes Button re-render reactively
const ReactiveButton = reactive(Button);

// ❌ Combines observer + reactive HOC
const Component = reactiveObserver(() => { /* ... */ });
```

### Correct

```tsx
// ✅ Fine-grained: only the Memo re-renders
function MyComponent() {
  return <div><Memo>{() => count$.get()}</Memo></div>;
}

// ✅ Show re-renders only the content when isLoading$ changes
function LoadingWrapper() {
  return <Show if={isLoading$}><Spinner /></Show>;
}

// ✅ For re-renders only changed items
function ItemList() {
  return <For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>;
}

// ✅ With @usels/vite-plugin-legend-memo — auto-wraps .get() calls
function MyComponent() {
  return <div>{count$.get()}</div>; // plugin auto-wraps in <Memo>
}
```

## Options

```ts
{
  "use-legend/no-reactive-hoc": ["warn", {
    "forbidHOCs": ["reactive", "reactiveObserver", "observer"],
    "importSources": ["@legendapp/state/react"],
    "allowList": []
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `forbidHOCs` | `string[]` | `["reactive","reactiveObserver","observer"]` | HOC names to flag when called. |
| `importSources` | `string[]` | `["@legendapp/state/react"]` | Only flag HOCs imported from these sources. |
| `allowList` | `string[]` | `[]` | HOC names to exclude from `forbidHOCs`. |

### Allowing specific HOCs

```ts
// Allow observer but forbid reactive and reactiveObserver
{
  "use-legend/no-reactive-hoc": ["warn", {
    "allowList": ["observer"]
  }]
}
```

## Notes

- The rule uses import binding identity — a local `observer` imported from a different package is **not** flagged.
- Re-export-only patterns (`export { observer }`) are not flagged.
- Dynamic imports (`await import(...)`) are not detected (known limitation).

## Related Rules

- [`no-enable-api`](./no-enable-api.md) — `enableReactTracking({ auto: true })` has the same whole-component reactivity concern.
- [`prefer-show-for-conditional`](./prefer-show-for-conditional.md) — Fine-grained alternative for conditional rendering.
- [`prefer-for-component`](./prefer-for-component.md) — Fine-grained alternative for list rendering.
