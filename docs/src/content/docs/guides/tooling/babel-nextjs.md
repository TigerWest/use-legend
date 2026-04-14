---
title: Babel / Next.js
description: Configure the Babel plugin directly for Next.js or non-Vite build pipelines.
---

Use the Babel plugin when your build pipeline cannot use the Vite plugin. The
Babel plugin is the underlying transform used by `@usels/vite-plugin`.

## Install

```bash
pnpm add -D @usels/babel-plugin @babel/core
```

## Basic Babel Configuration

```js
// babel.config.js
module.exports = {
  plugins: ["@usels/babel-plugin"],
};
```

## Next.js

For Next.js, add the plugin to `.babelrc` after the Next preset:

```json
{
  "presets": ["next/babel"],
  "plugins": [
    [
      "@usels/babel-plugin",
      {
        "autoWrap": {
          "importSource": "@usels/core"
        },
        "autoScope": {
          "importSource": "@usels/core"
        }
      }
    ]
  ]
}
```

## What It Does

The plugin handles the same two transforms as the Vite plugin:

| Transform | Effect |
| --- | --- |
| `autoWrap` | Wraps JSX observable `.get()` reads with `Memo` boundaries |
| `autoScope` | Transforms `"use scope"` into `useScope(...)` |

Use only one transform path for a file. If Vite is already running
`@usels/vite-plugin`, do not add the Babel plugin again for the same source.

## Notes

- Ensure the transform runs before final JSX compilation.
- Keep `importSource` as `@usels/core` unless you intentionally provide a custom
  reactive wrapper.
- Prefer [Vite](/use-legend/guides/tooling/vite/) when your app uses Vite.
