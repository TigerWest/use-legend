import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.spec.ts"],
    exclude: ["src/**/*.browser.spec.ts", "node_modules"],
    environment: "node",
    globals: true,
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/index.ts"],
    },
  },
});
