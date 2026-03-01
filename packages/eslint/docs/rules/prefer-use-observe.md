# prefer-use-observe

Prefer `useObserve` or `useObserveEffect` over `useEffect` in Legend-State projects.

## Rule Details

This rule flags **all `useEffect` calls** imported from `react` (or configured sources). In Legend-State projects, `useObserve` and `useObserveEffect` are the preferred alternatives:

- **No dependency array** — observables accessed inside the callback are tracked automatically.
- **No stale closure bugs** — re-runs reliably when any accessed observable changes.
- **Cleanup support** — `useObserveEffect` handles cleanup functions just like `useEffect`.

### Incorrect

```tsx
import { useEffect } from 'react';

// ❌ Observable side effect — use useObserve instead
useEffect(() => {
  console.log(count$.get());
}, [count$.get()]);

// ❌ Non-observable side effect — still flagged; prefer useObserve or move to module level
useEffect(() => {
  document.title = title;
}, [title]);

// ❌ Fetch on mount — flagged
useEffect(() => {
  fetch('/api/data');
}, []);

// ❌ Aliased import is also tracked
import { useEffect as useMount } from 'react';
useMount(() => { /* ... */ }, []);
```

### Correct

```tsx
import { useObserve, useObserveEffect } from '@legendapp/state/react';

// ✅ Auto-tracks count$ — re-runs whenever count$ changes
useObserve(() => {
  console.log(count$.get());
});

// ✅ Auto-tracks all observables in the callback
useObserve(() => {
  document.title = `${user$.name.get()} — ${count$.get()} items`;
});

// ✅ useObserveEffect for cleanup
useObserveEffect(() => {
  const handler = count$.onChange((v) => doSomething(v));
  return () => handler();
});
```

## Not Flagged

```tsx
// ✅ Already using useObserve — no warning
import { useObserve } from '@legendapp/state/react';
useObserve(() => { console.log(count$.get()); });

// ✅ useEffect from a non-tracked source — no warning
import { useEffect } from 'preact/hooks';
useEffect(() => { console.log(count$.get()); }, []);

// ✅ Import without calling — no warning (handled by no-unused-vars)
import { useEffect } from 'react';

// ✅ useLayoutEffect with default options — no warning
// Legend-State has no useLayoutEffect equivalent; use the browser API directly
import { useLayoutEffect } from 'react';
useLayoutEffect(() => { /* DOM measurement */ }, []);
```

## Options

```ts
{
  "use-legend/prefer-use-observe": ["warn", {
    "importSources": ["react"],
    "replacements": ["@legendapp/state/react", "@usels/core"],
    "includeLayoutEffect": false,
    "allowlist": []
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `importSources` | `string[]` | `["react"]` | Packages from which `useEffect` is tracked. Add `"preact/hooks"` to also cover Preact. |
| `replacements` | `string[]` | `["@legendapp/state/react","@usels/core"]` | Suggested replacement packages (shown in documentation links). |
| `includeLayoutEffect` | `boolean` | `false` | When `true`, also flags `useLayoutEffect`. |
| `allowlist` | `string[]` | `[]` | File paths or component names to exclude (future use). |

### Custom import sources

```ts
// Flag useEffect from both react and preact/hooks
{
  "use-legend/prefer-use-observe": ["warn", {
    "importSources": ["react", "preact/hooks"]
  }]
}
```

## Notes

- The rule flags **all** `useEffect` calls from tracked sources — it does not check whether the callback accesses observables.
- Import binding identity is used: only `useEffect` from a tracked source is flagged. A locally-defined `useEffect` function is safe.

## Related Rules

- [`prefer-use-observable`](./prefer-use-observable.md) — Companion rule for `useState` → `useObservable`.
- [`observable-naming`](./observable-naming.md) — Ensures observables accessed inside effects have `$` suffix.
