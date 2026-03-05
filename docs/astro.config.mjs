// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import starlightCatppuccin from "@catppuccin/starlight";
import { defineConfig } from "astro/config";
import ecTwoSlash from "expressive-code-twoslash";
import { fileURLToPath } from "node:url";
import { autoWrap } from "@usels/vite-plugin-legend-memo";

const DOCS_WARMUP_MODE = process.env.DOCS_WARMUP_MODE ?? "off";
const DOCS_FAST_DEV = process.env.DOCS_FAST_DEV === "1";
const DOCS_ENABLE_TWOSLASH = process.env.DOCS_ENABLE_TWOSLASH !== "0";

const WARMUP_SSR_FILES_BY_MODE = {
  off: [],
  // Warm all MDX pages. Slow startup, but no first-hit cold transforms.
  full: ["./src/content/docs/**/*.mdx"],
};

const warmupSsrFiles = DOCS_ENABLE_TWOSLASH
  ? (WARMUP_SSR_FILES_BY_MODE[DOCS_WARMUP_MODE] ?? WARMUP_SSR_FILES_BY_MODE.off)
  : [];

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
    plugins: [autoWrap({ allGet: true })],
    resolve: {
      alias: {
        "@demos/core": fileURLToPath(new URL("../packages/core/src", import.meta.url)),
        "@demos/integrations": fileURLToPath(
          new URL("../packages/integrations/src", import.meta.url)
        ),
        // core package path aliases (used by demo.tsx files)
        "@browser": fileURLToPath(new URL("../packages/core/src/browser", import.meta.url)),
        "@elements": fileURLToPath(new URL("../packages/core/src/elements", import.meta.url)),
        "@reactivity": fileURLToPath(new URL("../packages/core/src/reactivity", import.meta.url)),
        "@sensors": fileURLToPath(new URL("../packages/core/src/sensors", import.meta.url)),
        "@shared": fileURLToPath(new URL("../packages/core/src/shared", import.meta.url)),
        "@timer": fileURLToPath(new URL("../packages/core/src/timer", import.meta.url)),
        "@utilities": fileURLToPath(new URL("../packages/core/src/utilities", import.meta.url)),
        "@components": fileURLToPath(new URL("../packages/core/src/components", import.meta.url)),
      },
    },
  },
  integrations: [
    starlight({
      title: "use-legend",
      plugins: [starlightCatppuccin()],
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
        PageTitle: "./src/components/overrides/PageTitle.astro",
        ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Getting Started", slug: "guides/getting-started" },
            { label: "Best Practices", slug: "guides/best-practices" },
            { label: "ESLint Plugin", slug: "guides/eslint" },
          ],
        },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
        {
          label: "Core",
          autogenerate: { directory: "core" },
        },
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
