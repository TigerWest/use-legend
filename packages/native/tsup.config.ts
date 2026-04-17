import { defineConfig } from 'tsup';
import { fixImportsPlugin } from 'esbuild-fix-imports-plugin';

const shared = {
  entry: ['src/**/*.{ts,tsx}', '!src/**/*.spec.*'],
  sourcemap: true,
  clean: false,
  bundle: false,
  esbuildPlugins: [fixImportsPlugin()],
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
