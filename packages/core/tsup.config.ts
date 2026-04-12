import { defineConfig } from 'tsup';

const shared = {
  entry: ['src/**/*.{ts,tsx}', '!src/**/*.spec.*'],
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: false,
  bundle: false,
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
