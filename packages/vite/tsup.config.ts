import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["@babel/core", "@usels/babel-plugin", "vite"],
  clean: true,
  sourcemap: true,
});
