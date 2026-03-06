// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightCatppuccin from "@catppuccin/starlight";
import { defineConfig } from "astro/config";
import ecTwoSlash from "expressive-code-twoslash";
import { fileURLToPath } from "node:url";
import { autoWrap } from "@usels/vite-plugin-legend-memo";

const DOCS_WARMUP_MODE = process.env.DOCS_WARMUP_MODE ?? "off";
const DOCS_FAST_DEV = process.env.DOCS_FAST_DEV === "1";
const DOCS_ENABLE_TWOSLASH = process.env.DOCS_ENABLE_TWOSLASH !== "0";
const DOCS_ENABLE_NATIVE_TAB = process.env.DOCS_ENABLE_NATIVE_TAB === "1";

const WARMUP_SSR_FILES_BY_MODE = {
  off: [],
  // Warm all MDX pages. Slow startup, but no first-hit cold transforms.
  full: ["./src/content/docs/**/*.mdx"],
};

const warmupSsrFiles = DOCS_ENABLE_TWOSLASH
  ? (WARMUP_SSR_FILES_BY_MODE[DOCS_WARMUP_MODE] ?? WARMUP_SSR_FILES_BY_MODE.off)
  : [];

const CORE_SRC = fileURLToPath(new URL("../packages/core/src", import.meta.url));
const WEB_SRC = fileURLToPath(new URL("../packages/web/src", import.meta.url));
const NATIVE_SRC = fileURLToPath(new URL("../packages/native/src", import.meta.url));
const INTEGRATIONS_SRC = fileURLToPath(new URL("../packages/integrations/src", import.meta.url));

function rewriteWebAliasImports() {
  const replacements = [
    ["@browser/", "@web-browser/"],
    ["@elements/", "@web-elements/"],
    ["@sensors/", "@web-sensors/"],
  ];

  return {
    name: "rewrite-web-alias-imports",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("/packages/web/src/")) {
        return null;
      }

      let nextCode = code;
      for (const [from, to] of replacements) {
        nextCode = nextCode.replaceAll(`"${from}`, `"${to}`);
        nextCode = nextCode.replaceAll(`'${from}`, `'${to}`);
      }

      if (nextCode === code) {
        return null;
      }

      return {
        code: nextCode,
        map: null,
      };
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://tigerwest.github.io/use-legend",
  base: "/use-legend",
  vite: {
    server: {
      warmup:
        warmupSsrFiles.length > 0
          ? {
              // Pre-transform selected MDX files so TwoSlash's TypeScript
              // Language Service initializes before browser requests.
              // Use DOCS_WARMUP_MODE=full when first-hit cold transforms
              // still exceed Vite's 60s transport timeout.
              ssrFiles: warmupSsrFiles,
            }
          : undefined,
    },
    plugins: [tailwindcss(), rewriteWebAliasImports(), autoWrap({ allGet: true })],
    resolve: {
      alias: [
        { find: "@demos/core", replacement: CORE_SRC },
        { find: "@demos/web", replacement: WEB_SRC },
        { find: "@demos/native", replacement: NATIVE_SRC },
        { find: "@demos/integrations", replacement: INTEGRATIONS_SRC },
        // Resolve workspace packages to source during docs builds.
        { find: /^@usels\/core$/, replacement: `${CORE_SRC}/index.ts` },
        { find: /^@usels\/core\/(.*)$/, replacement: `${CORE_SRC}/$1` },
        { find: /^@usels\/web$/, replacement: `${WEB_SRC}/index.ts` },
        { find: /^@usels\/web\/(.*)$/, replacement: `${WEB_SRC}/$1` },
        { find: /^@usels\/native$/, replacement: `${NATIVE_SRC}/index.ts` },
        { find: /^@usels\/native\/(.*)$/, replacement: `${NATIVE_SRC}/$1` },
        { find: /^@usels\/integrations$/, replacement: `${INTEGRATIONS_SRC}/index.ts` },
        { find: /^@usels\/integrations\/(.*)$/, replacement: `${INTEGRATIONS_SRC}/$1` },
        // core package path aliases (used by demo.tsx files)
        { find: "@browser", replacement: `${WEB_SRC}/browser` },
        { find: "@elements", replacement: `${CORE_SRC}/elements` },
        { find: "@reactivity", replacement: `${CORE_SRC}/reactivity` },
        { find: "@sensors", replacement: `${WEB_SRC}/sensors` },
        { find: "@shared", replacement: `${CORE_SRC}/shared` },
        { find: "@timer", replacement: `${CORE_SRC}/timer` },
        { find: "@utilities", replacement: `${CORE_SRC}/utilities` },
        { find: "@components", replacement: `${CORE_SRC}/components` },
        { find: "@state", replacement: `${CORE_SRC}/state` },
        // web package path aliases are namespaced to avoid collisions with core aliases.
        { find: "@web-browser", replacement: `${WEB_SRC}/browser` },
        { find: "@web-elements", replacement: `${WEB_SRC}/elements` },
        { find: "@web-sensors", replacement: `${WEB_SRC}/sensors` },
      ],
    },
  },
  integrations: [
    starlight({
      title: "use-legend",
      plugins: [starlightCatppuccin()],
      customCss: ["./src/styles/global.css"],
      head: [
        {
          tag: "script",
          attrs: {
            src: "https://www.googletagmanager.com/gtag/js?id=G-7JDXH9F2LZ",
            async: true,
          },
        },
        {
          tag: "script",
          content: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7JDXH9F2LZ');
          `,
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/TigerWest/use-legend",
        },
      ],
      expressiveCode: {
        themes: ["github-dark"],
        useStarlightDarkModeSwitch: !DOCS_FAST_DEV,
        useStarlightUiThemeColors: !DOCS_FAST_DEV,
        plugins: DOCS_ENABLE_TWOSLASH
          ? [
              ecTwoSlash({
                includeJsDoc: !DOCS_FAST_DEV,
                twoslashOptions: {
                  compilerOptions: {
                    lib: ["dom", "dom.iterable", "esnext"],
                    jsx: 4, // react-jsx
                    jsxImportSource: "react",

                    moduleResolution: 100, // bundler
                    module: 99, // esnext
                    target: 99, // esnext
                    strictNullChecks: true,
                    noImplicitAny: false,
                  },
                },
              }),
            ]
          : [],
      },
      components: {
        Header: "./src/components/overrides/Header.astro",
        PageTitle: "./src/components/overrides/PageTitle.astro",
        ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      },
      routeMiddleware: "./src/route-data.ts",
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Introduction", slug: "guides" },
            { label: "Getting Started", slug: "guides/getting-started" },
            {
              label: "Patterns & Best Practices",
              items: [
                { label: "Best Practices", slug: "guides/best-practices" },
                { label: "Recommend Pattern", slug: "guides/recommend-pattern" },
              ],
            },
            {
              label: "Tooling",
              items: [
                { label: "ESLint Plugin", slug: "guides/eslint" },
                { label: "Babel", slug: "guides/babel" },
                { label: "Vite", slug: "guides/vite" },
              ],
            },
          ],
        },
        {
          label: "Core",
          autogenerate: { directory: "core" },
        },
        {
          label: "Web",
          autogenerate: { directory: "web" },
        },
        ...(DOCS_ENABLE_NATIVE_TAB
          ? [
              {
                label: "Native",
                autogenerate: { directory: "native" },
              },
            ]
          : []),
        {
          label: "Integrations",
          autogenerate: { directory: "integrations" },
        },
      ],
    }),
    mdx(),
    react(),
  ],
});
