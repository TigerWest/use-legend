import { defineConfig } from 'tsup';

const shared = {
  entry: ['src/index.ts'],
  external: ['@babel/core', '@babel/types', '@babel/traverse'],
  sourcemap: true,
  clean: false,
};

export default defineConfig([
  {
    ...shared,
    format: ['esm'],
    outDir: 'dist/esm',
    dts: true,
  },
  {
    ...shared,
    format: ['cjs'],
    outDir: 'dist/cjs',
    dts: false,
  },
]);
