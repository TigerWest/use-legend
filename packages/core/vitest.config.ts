import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Test files to include (exclude browser-specific specs)
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
    exclude: ["src/**/*.browser.spec.ts", "src/**/*.browser.spec.tsx", "node_modules"],

    // Test environment
    environment: "node",

    // Global test APIs
    globals: true,

    // Type checking (runs alongside runtime tests)
    typecheck: {
      enabled: true,
    },

    // Coverage configuration specific to utils package
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/index.ts"],
    },
  },
});
