---
name: twoslash-docs
description: Guide for writing TwoSlash-annotated code blocks in lsa-utils documentation
---

# TwoSlash Docs Skill

Write TypeScript code blocks in documentation that show hover type information using TwoSlash.

## When to use TwoSlash

Use `twoslash` on code blocks in `## Usage` sections where showing type information adds value:
- Full component examples showing return type destructuring
- Blocks with `^?` type queries

Do NOT use `twoslash` on:
- Short snippets that only show options or API shape (use plain `typescript`)
- Blocks using `declare const el: HTMLElement` + hooks → triggers error 2589 (type instantiation too deep). Use a full `function Component()` wrapper instead.
- Blocks using `console.log` or other DOM globals → triggers error 2584 in some TwoSlash contexts. Replace with a comment or omit the body.
- Blocks without meaningful hover type info

## Code Block Syntax

### Basic (with noErrors — required for @las/utils imports)

```md
\`\`\`tsx twoslash
// @noErrors
import { useSomething } from '@las/utils'

function Component() {
  const result = useSomething()
  //    ^? — shows inferred type on hover
}
\`\`\`
```

### Always include `// @noErrors` when

- Importing from `@las/utils` (TwoSlash VFS cannot resolve workspace packages at runtime)
- Using DOM APIs (`console`, `HTMLElement`, etc.) without explicit lib setup
- Using complex `@legendapp/state` Observable types (may trigger "type instantiation too deep")

## TwoSlash Annotations

| Syntax | Effect |
|--------|--------|
| `// @noErrors` | Suppress TypeScript errors (hover still works) |
| `//    ^?` | Show inferred type at that position inline |
| `// @errors: 2345` | Mark an expected error (shows as annotation) |
| `// @log: value` | Show a log annotation |

**`^?` position rule**: The `^` must be directly under the identifier you want to inspect. Add spaces to align:

```tsx twoslash
// @noErrors
import { useEl$ } from '@las/utils'
const el$ = useEl$()
//    ^? shows type of el$
```

## Full Example

````md
## Usage

```tsx twoslash
// @noErrors
import { useWindowSize } from '@las/utils'

function Component() {
  const size$ = useWindowSize()
  //    ^?

  return <div>{size$.width.get()}</div>
}
```
````

## Current TwoSlash Config (astro.config.mjs)

```js
ecTwoSlash({
  twoslashOptions: {
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      jsx: 4,               // react-jsx
      jsxImportSource: 'react',
      moduleResolution: 100, // bundler
      module: 99,           // esnext
      target: 99,           // esnext
      strictNullChecks: true,
      noImplicitAny: false,
    },
  },
})
```

## Known Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| **2589** Type instantiation too deep | `declare const el: HTMLElement` + Legend-State hook in TwoSlash | Use `function Component() { ... }` wrapper instead of top-level `declare const` |
| **2584** Cannot find name 'console' | DOM globals unavailable in some TwoSlash VFS contexts | Remove `console.*` from TwoSlash blocks; replace with `// ...` comment or use plain `tsx` |
| **Cannot find module '@las/utils'** | Workspace package not in TwoSlash VFS | Always add `// @noErrors` when importing from `@las/utils` |

### Pattern to avoid (causes 2589)

```tsx twoslash
// @noErrors
// ❌ declare const + hook triggers deep type instantiation
declare const el: HTMLElement
const { y } = useScroll(el) // → TS2589
```

### Correct pattern (full component wrapper)

```tsx twoslash
// @noErrors
import { useScroll, useEl$ } from '@las/utils'

// ✅ full component: types resolve correctly
function Component() {
  const el$ = useEl$<HTMLDivElement>()
  const { y } = useScroll(el$)
}
```

## Checklist before writing twoslash block

- [ ] Does the block import from `@las/utils`? → add `// @noErrors`
- [ ] Does the block use `declare const` + a hook? → use full `function Component()` instead
- [ ] Does the block use `console.*`? → replace with comment or use plain `tsx`
- [ ] Is the type info meaningful for the reader? → use `//    ^?`
- [ ] Run `pnpm build` in `packages/docs` to verify no build errors
