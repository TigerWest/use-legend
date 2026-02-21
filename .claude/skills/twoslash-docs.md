---
name: twoslash-docs
description: Guide for writing TwoSlash-annotated code blocks in lsa-utils documentation
---

# TwoSlash Docs Skill

Write TypeScript code blocks in documentation that show hover type information using TwoSlash.

## When to use TwoSlash

Use `twoslash` on code blocks in `## Usage` sections where showing type information adds value:
- Function return types
- Parameter types
- Observable types from `@legendapp/state`

Do NOT use `twoslash` on:
- Short snippets that only show API shape (use plain `tsx`)
- Blocks without meaningful type info to display

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

## Checklist before writing twoslash block

- [ ] Does the block import from `@las/utils`? → add `// @noErrors`
- [ ] Does the block use DOM APIs (`console`, `HTMLElement`)? → add `// @noErrors`
- [ ] Is the type info meaningful for the reader? → use `//    ^?`
- [ ] Run `pnpm build` in `packages/docs` to verify no build errors
