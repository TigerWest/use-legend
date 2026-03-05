---
title: Babel
description: Configure the Babel plugin for automatic fine-grained memo wrapping.
---

Use the Babel plugin when you are not using the Vite plugin path.

## Install

```bash
npm install -D @usels/babel-plugin-legend-memo
```

## Configuration

```js
// babel.config.js
module.exports = {
  plugins: ['@usels/babel-plugin-legend-memo'],
};
```

## Notes

- Prefer one transform path at a time (Babel or Vite) to keep behavior predictable.
- Ensure the transform runs before final JSX compilation.
