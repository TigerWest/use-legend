# no-enable-api

Warn against using Legend-State global `enable*` configuration APIs.

## Rule Details

Legend-State's `enable*` configuration functions mutate global state (prototypes or module-level registries). Several of them conflict with the `$` suffix naming convention, cause whole-component re-renders, or silently alter the behavior of the entire application.

### Incorrect

```ts
// ❌ Adds .$ shorthand accessor — conflicts with $ suffix convention
import { enable$GetSet } from '@legendapp/state/config/enable$GetSet';
enable$GetSet();

// ❌ Adds ._ shorthand accessor
import { enable_PeekAssign } from '@legendapp/state/config/enable_PeekAssign';
enable_PeekAssign();

// ❌ Enables whole-component reactive tracking
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
enableReactTracking({ auto: true });

// ❌ Adds .use() globally — may trigger whole-component re-renders
import { enableReactUse } from '@legendapp/state/config/enableReactUse';
enableReactUse();

// ❌ Registers <Reactive.*> namespace globally
import { enableReactComponents } from '@legendapp/state/config/enableReactComponents';
enableReactComponents();
```

### Correct

```ts
// ✅ Use explicit .get() / .set()
const value = count$.get();
count$.set(value + 1);

// ✅ Fine-grained reactive components
<Show if={isVisible$}><Modal /></Show>
<Memo>{() => count$.get()}</Memo>
<For each={items$}>{(item$) => <li>{item$.name.get()}</li>}</For>

// ✅ useSelector for one-off subscriptions
import { useSelector } from '@legendapp/state/react';
const count = useSelector(count$);
```

## API Reference

| API | Import Path | Why Discouraged |
|-----|------------|-----------------|
| `enable$GetSet` | `@legendapp/state/config/enable$GetSet` | Adds `.$` shorthand; conflicts with `$` suffix convention |
| `enable_PeekAssign` | `@legendapp/state/config/enable_PeekAssign` | Adds `._` shorthand; conflicts with `$` suffix convention |
| `enableReactTracking` | `@legendapp/state/config/enableReactTracking` | Makes entire components reactive; whole-component re-renders |
| `enableReactUse` | `@legendapp/state/config/enableReactUse` | Global `.use()` method may trigger whole-component re-renders |
| `enableReactComponents` | `@legendapp/state/config/enableReactComponents` | Registers `<Reactive.*>` globally; prefer explicit imports |
| `enableReactNativeComponents` | `@legendapp/state/config/enableReactNativeComponents` | Registers `<Reactive.*>` globally (React Native); prefer explicit imports |

## Options

```ts
{
  "use-legend/no-enable-api": ["warn", {
    "forbidApis": [
      "enable$GetSet",
      "enable_PeekAssign",
      "enableReactTracking",
      "enableReactUse",
      "enableReactComponents",
      "enableReactNativeComponents"
    ],
    "allowList": []  // APIs to exclude from forbidApis
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `forbidApis` | `string[]` | All 6 APIs | APIs to flag when called. |
| `allowList` | `string[]` | `[]` | APIs to remove from `forbidApis` (project-specific exceptions). |

### Allowing specific APIs

```ts
// Allow enableReactComponents but keep other restrictions
{
  "use-legend/no-enable-api": ["warn", {
    "allowList": ["enableReactComponents"]
  }]
}
```

## Notes

- The rule detects calls only when the API is **imported and called**. Import-only (unused) references are handled by `no-unused-vars`.
- Aliases work automatically: if you import `enable$GetSet as enableDirectAccess`, the rule tracks the local binding name.

## Related Rules

- [`no-reactive-hoc`](./no-reactive-hoc.md) — Discourages `observer()` HOC (similar whole-component reactivity concern).
- [`observable-naming`](./observable-naming.md) — `enable$GetSet` conflicts with this convention.
