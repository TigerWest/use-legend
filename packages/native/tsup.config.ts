import { defineConfig } from 'tsup';

const shared = {
  entry: ['src/index.ts'],
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
