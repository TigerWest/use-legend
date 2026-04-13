---
title: Babel
description: Configure the Babel plugin for automatic fine-grained memo wrapping.
---

Use the Babel plugin when you are not using the Vite plugin path.

## Install

```bash
pnpm add -D @usels/babel-plugin @babel/core
```

## Configuration

```js
// babel.config.js
module.exports = {
  plugins: ["@usels/babel-plugin"],
};
```

## Notes

- Prefer one transform path at a time (Babel or Vite) to keep behavior predictable.
- Ensure the transform runs before final JSX compilation.
- The plugin imports `Memo` and `useScope` from `@usels/core` by default.
