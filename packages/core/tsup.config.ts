import { defineConfig } from "tsup";
import { fixImportsPlugin } from "esbuild-fix-imports-plugin";

const dynamicImportExtensionsPlugin = () => ({
  name: "dynamicImportExtensionsPlugin",
  setup(build: any) {
    const outExtension = build.initialOptions.outExtension?.[".js"] ?? ".js";
    const dynamicImportRE = /\bimport\s*\(\s*(["'])(\.{1,2}\/[^"']+)\1\s*\)/g;
    const hasJSExtensionRE = /\.js$/i;
    const hasNonJSExtensionRE =
      /\.(?:png|svg|css|scss|csv|tsv|xml|toml|ini|jpe?g|json|md|mdx|ya?ml|gif|webp|ico|mp4|webm|ogg|wav|mp3|m4a|aac|woff2?|eot|ttf|otf|wasm)$/i;

    build.onEnd((result: any) => {
      if (result.errors.length > 0) return;

      for (const outputFile of result.outputFiles ?? []) {
        if (!outputFile.path.endsWith(outExtension)) continue;

        outputFile.contents = Buffer.from(
          outputFile.text.replace(dynamicImportRE, (_match: any, quote: any, importPath: any) => {
            if (importPath.endsWith(outExtension) || hasNonJSExtensionRE.test(importPath)) {
              return `import(${quote}${importPath}${quote})`;
            }

            if (hasJSExtensionRE.test(importPath)) {
              return `import(${quote}${importPath.replace(hasJSExtensionRE, outExtension)}${quote})`;
            }

            return `import(${quote}${importPath}${outExtension}${quote})`;
          })
        );
      }
    });
  },
});

const shared = {
  entry: ["src/**/*.{ts,tsx}", "!src/**/*.spec.*"],
  tsconfig: "tsconfig.build.json",
  sourcemap: true,
  clean: false,
  bundle: false,
  esbuildPlugins: [fixImportsPlugin(), dynamicImportExtensionsPlugin()],
};

export default defineConfig([
  {
    ...shared,
    format: ["esm"],
    outDir: "dist/esm",
    dts: true,
  },
  {
    ...shared,
    format: ["cjs"],
    outDir: "dist/cjs",
    dts: false,
  },
]);
