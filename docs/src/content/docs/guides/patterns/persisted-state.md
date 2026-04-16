---
title: Persisted State
description: Persist observable state with useStorage, useLocalStorage, and hydration-aware UI.
---

Persisted state is still observable state. Use the storage helpers when the
source of truth should survive reloads.

## localStorage

Use `useLocalStorage` for a browser-only component:

```tsx
import { useLocalStorage } from "@usels/web";

function Counter() {
  const count$ = useLocalStorage("count", 0);

  return <button onClick={() => count$.set((count) => count + 1)}>Count {count$.get()}</button>;
}
```

## Explicit Hydration State

Use `useStorage` when the UI needs to know whether persistence has loaded:

```tsx
import { ObservablePersistIndexedDB } from "@usels/core";
import { useStorage } from "@usels/core";

function Profile() {
  const { data$: profile$, isPersistLoaded$, error$ } = useStorage(
    "profile",
    { name: "" },
    { plugin: ObservablePersistIndexedDB }
  );

  return error$.get()
    ? <p>Failed to load profile.</p>
    : !isPersistLoaded$.get()
      ? <p>Loading...</p>
      : <input value={profile$.name.get()} onChange={(event) => profile$.name.set(event.target.value)} />;
}
```

Each `.get()` call inside the ternary is a fine-grained reactive leaf — the component does not need to re-run for the branch to switch. See [Derived State & Effects → Avoid Early Return](/use-legend/guides/patterns/derived-state-and-effects/#avoid-early-return-with-get) for more on this pattern.

## Store Pattern

For app state such as carts or preferences, define persisted observables inside a
store and validate the loaded snapshot before marking the store as hydrated.

Use [useStorage](/use-legend/core/useStorage/) for advanced persistence and
[useLocalStorage](/use-legend/web/useLocalStorage/) for the browser
wrapper.

## Related

- [Local Draft, Global Commit](/use-legend/guides/patterns/local-draft-global-commit/) — persist committed values without saving every keystroke.
- [Utility Hooks](/use-legend/guides/patterns/utility-hooks/) — the sync hook catalog.
- [Data Fetching](/use-legend/guides/patterns/data-fetching/) — server state alongside persisted client state.
