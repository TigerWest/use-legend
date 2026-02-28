import type { Plugin } from 'vite';
import type { PluginOptions } from '@usels/babel-plugin-legend-memo';

/**
 * Vite plugin that applies @usels/babel-plugin-legend-memo during transform.
 *
 * Wraps Legend-State observable .get() calls in JSX with <Auto> component
 * for fine-grained reactive rendering.
 *
 * IMPORTANT: Must be placed BEFORE @vitejs/plugin-react in the plugins array,
 * because `enforce: "pre"` ensures this runs before esbuild JSX transform.
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { autoWrap } from '@usels/vite-plugin-legend-memo';
 *
 * export default defineConfig({
 *   plugins: [
 *     autoWrap({ importSource: '@usels/core' }),
 *     react(),
 *   ],
 * });
 * ```
 */
export function autoWrap(opts: PluginOptions = {}): Plugin {
  return {
    name: '@usels/vite-plugin-legend-memo',
    // Must run before esbuild JSX transform (before @vitejs/plugin-react)
    enforce: 'pre',

    async transform(code, id) {
      // Only process .jsx and .tsx files
      if (!/\.[jt]sx$/.test(id)) return null;

      // Lazy import @babel/core to avoid bundling it
      const babel = await import('@babel/core');

      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: [['@usels/babel-plugin-legend-memo', opts]],
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
        sourceMaps: true,
        configFile: false,
        babelrc: false,
      });

      if (!result || !result.code) return null;

      return {
        code: result.code,
        map: result.map ?? undefined,
      };
    },
  };
}

export default autoWrap;
export type { PluginOptions };
