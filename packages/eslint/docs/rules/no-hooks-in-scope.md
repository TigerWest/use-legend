# no-hooks-in-scope

Disallow React hook calls inside `useScope` factories and functions marked with `"use scope"`.

## Rule Details

`useScope` factories run outside React's hook call order. A `"use scope"` directive is also transformed into a `useScope` factory, so hook calls in that scoped body would run in the wrong place after the transform.

### Incorrect

```tsx
import { useScope } from "@usels/core";
import { useMemo, useState } from "react";

function useCounter() {
  return useScope(() => {
    const [count] = useState(0);
    return { count };
  });
}

function Component() {
  "use scope";
  const value = useMemo(() => 1, []);
  return value;
}
```

### Correct

```tsx
import { useScope } from "@usels/core";
import { useMemo } from "react";

function useCounter() {
  const initial = useMemo(() => 0, []);

  return useScope(
    (p) => {
      const count$ = observable(p.initial);
      return { count$ };
    },
    { initial }
  );
}

function Component() {
  "use scope";
  const count$ = observable(0);
  return <div>{count$.get()}</div>;
}
```

## What Gets Flagged

- `useXxx()` inside `useScope(() => { ... })`
- `React.useXxx()` inside `useScope(() => { ... })`
- hook calls inside functions marked with `"use scope"`
- aliased `useScope` imports from configured sources, such as `import { useScope as scope } from "@usels/core"`

## Options

```ts
{
  "use-legend/no-hooks-in-scope": ["error", {
    "useScopeSources": ["@usels/core", "@primitives/useScope"]
  }]
}
```

| Option            | Type       | Default                                  | Description                                                                        |
| ----------------- | ---------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `useScopeSources` | `string[]` | `["@usels/core","@primitives/useScope"]` | Import sources whose named `useScope` export should be tracked, including aliases. |

## Related Rules

- [`prefer-use-observe`](./prefer-use-observe.md) — Prefer Legend-State reactive effects over `useEffect`.
