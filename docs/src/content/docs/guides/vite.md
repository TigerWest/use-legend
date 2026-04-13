---
title: Vite
description: Configure the Vite plugin for automatic JSX observable memo wrapping and "use scope" transforms.
---

Use the Vite plugin for automatic wrapping of observable reads in JSX and
`"use scope"` transforms.

## Install

```bash
pnpm add -D @usels/vite-plugin @usels/babel-plugin @babel/core
```

## Configuration

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import useLegend from "@usels/vite-plugin";

export default defineConfig({
  plugins: [useLegend(), react()],
});
```

## Notes

- Place `useLegend()` before `react()`.
- The plugin imports `Memo` and `useScope` from `@usels/core` by default.
- Use this path unless you have a Babel-first build pipeline.
