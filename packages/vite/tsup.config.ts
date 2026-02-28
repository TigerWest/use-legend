import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  external: ['@babel/core', '@usels/babel-plugin-legend-memo', 'vite'],
  clean: true,
  sourcemap: true,
});
