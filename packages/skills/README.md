# @usels/skills

AI skill reference files for the [use-legend](https://github.com/user/lsa-utils) hooks library.

Modeled after [vueuse/skills](https://github.com/vueuse/skills) — provides AI-consumable
reference documentation for `@usels/core` and `@usels/web` hooks.

## Structure

```
skills/
└── use-legend-hooks/
    ├── SKILL.md          # Master table of all hooks by category
    └── references/
        ├── useDebounced.md
        └── ... (105 hooks total)
```

## Regenerate

```sh
pnpm --filter @usels/skills build
```

The build script reads frontmatter from source `index.md` files and type declarations
from `index.ts` files across `packages/core` and `packages/web`.
