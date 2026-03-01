# prefer-use-observable

Prefer `useObservable` over React's `useState` for fine-grained reactivity in Legend-State projects.

## Rule Details

React's `useState` causes the entire component to re-render when the state changes. `useObservable` from Legend-State returns an observable that supports fine-grained reactivity — only the parts of the UI that actually read the value are updated.

Using `useObservable` also:
- Eliminates setter functions (`setCount`, `setUser`, …) in favor of direct `.set()` calls.
- Enables nested property updates without spread (`user$.name.set('foo')` vs `setUser({ ...user, name: 'foo' })`).
- Integrates naturally with the `$` suffix naming convention.

### Incorrect

```tsx
import { useState } from 'react';

// ❌ Whole-component re-render on every state change
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: '' });
const [isOpen, setIsOpen] = useState(false);
```

### Correct

```tsx
import { useObservable } from '@legendapp/state/react';

// ✅ Fine-grained: only UI that reads count$ re-renders
const count$ = useObservable(0);
const user$ = useObservable({ name: '' });
const isOpen$ = useObservable(false);

// Update without setter functions
count$.set(c => c + 1);
user$.name.set('foo');
isOpen$.set(true);
```

## Options

```ts
{
  "use-legend/prefer-use-observable": ["warn", {
    "importSources": ["react"],
    "replacements": ["@legendapp/state/react", "@usels/core"],
    "allowPatterns": []
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `importSources` | `string[]` | `["react"]` | Packages from which `useState` is tracked. |
| `replacements` | `string[]` | `["@legendapp/state/react","@usels/core"]` | Suggested replacement packages (shown in documentation). |
| `allowPatterns` | `string[]` | `[]` | Regex patterns; variable names matching any pattern are exempt. |

### Allowing specific variable names

Some UI-only state (modal open state, tab index, etc.) may legitimately use `useState`:

```ts
{
  "use-legend/prefer-use-observable": ["warn", {
    "allowPatterns": ["^is[A-Z]", "^(open|show|visible)"]
  }]
}
```

```tsx
// ✅ Not flagged — matches allowPattern
const [isOpen, setIsOpen] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

## Notes

- Detection is import-based: only `useState` imported from a tracked source is flagged.
- Re-export-only patterns (`export { useState }`) are not flagged.
- The rule flags on call, not on import — importing `useState` without calling it is handled by `no-unused-vars`.

## Related Rules

- [`observable-naming`](./observable-naming.md) — Ensures `useObservable` return values get the `$` suffix.
- [`prefer-use-observe`](./prefer-use-observe.md) — Companion rule for `useEffect` → `useObserve`.
