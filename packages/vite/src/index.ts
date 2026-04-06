import type { Plugin } from "vite";
import type { CombinedOptions } from "@usels/babel-plugin";

/**
 * Vite plugin that runs autoWrap and autoScope transforms in a single pass.
 *
 * - `autoWrap`: Wraps JSX expressions in reactive Memo components (`.tsx`/`.jsx` only)
 * - `autoScope`: Transforms "use scope" directive into `useScope(() => {...})` calls
 *
 * V1 limitations for autoScope:
 * - Component props referenced inside scope body → compile error
 *   (use useScope(fn, props) directly for reactive props)
 */
export function legendPlugin(opts: CombinedOptions = {}): Plugin {
  return {
    name: "@usels/vite-plugin",
    enforce: "pre",
    async transform(code, id) {
      if (id.includes("/node_modules/")) return null;

      const isJsx = /\.[jt]sx$/.test(id);
      const isTs = /\.[jt]s$/.test(id);

      if (!isJsx && !isTs) return null;
      // Fast path: non-JSX files only need processing if "use scope" is present
      if (!isJsx && !code.includes('"use scope"') && !code.includes("'use scope'")) return null;

      const babel = await import("@babel/core");
      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: [["@usels/babel-plugin", opts]],
        parserOpts: { plugins: ["jsx", "typescript"] },
        sourceMaps: true,
        configFile: false,
        babelrc: false,
      });

      if (!result || !result.code) return null;
      return { code: result.code, map: result.map ?? undefined };
    },
  };
}

export default legendPlugin;
export type { CombinedOptions };
