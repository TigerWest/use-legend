---
title: Vite
description: Configure the Vite plugin for automatic JSX observable memo wrapping.
---

Use the Vite plugin for automatic wrapping of observable reads in JSX.

## Install

```bash
npm install -D @usels/vite-plugin-legend-memo
```

## Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoWrap } from '@usels/vite-plugin-legend-memo';

export default defineConfig({
  plugins: [
    autoWrap(),
    react(),
  ],
});
```

## Notes

- Place `autoWrap()` before `react()`.
- Use this path unless you have a Babel-first build pipeline.
