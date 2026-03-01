import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['src/**/*.browser.spec.ts'],
    globals: true,
    browser: {
      enabled: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: playwright() as any,
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.browser.spec.ts', 'src/index.ts'],
    },
  },
});
