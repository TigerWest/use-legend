import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test files to include (exclude browser-specific specs)
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.browser.spec.ts', 'node_modules'],

    // Test environment
    environment: 'node',

    // Global test APIs
    globals: true,

    // Coverage configuration specific to utils package
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts'],
    },
  },
});
