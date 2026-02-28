import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  external: ['@babel/core', '@babel/types', '@babel/traverse'],
  clean: true,
  sourcemap: true,
});
