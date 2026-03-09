import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    include: ["src/**/*.browser.spec.ts", "src/**/*.browser.spec.tsx"],
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    browser: {
      enabled: true,
      headless: process.env.HEADLESS !== "false",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: playwright() as any,
      instances: [
        { browser: "chromium" },
        { browser: "firefox" },
        { browser: "webkit" }, // Safari
      ],
    },
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.browser.spec.ts",
        "src/**/*.browser.spec.tsx",
        "src/index.ts",
        "src/types.ts",
        "src/__tests__/**",
      ],
    },
  },
});
