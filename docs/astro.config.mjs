// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightCatppuccin from "@catppuccin/starlight";
import { defineConfig } from "astro/config";
import ecTwoSlash from "expressive-code-twoslash";
import { fileURLToPath } from "node:url";
import useLegend from "@usels/vite-plugin-legend-memo";

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
    plugins: [tailwindcss(), useLegend({})],
    resolve: {
      alias: [
        {
          find: "@demos",
          replacement: fileURLToPath(new URL("./src/components/demos", import.meta.url)),
        },
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
        Hero: "./src/components/overrides/Hero.astro",
        PageTitle: "./src/components/overrides/PageTitle.astro",
        ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
        MarkdownContent: "./src/components/overrides/MarkdownContent.astro",
      },
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
              collapsed: true,
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
          items: [
            { label: "State", autogenerate: { directory: "core/state" } },
            { label: "Reactivity", autogenerate: { directory: "core/reactivity" } },
            { label: "Observe", autogenerate: { directory: "core/observe" } },
            { label: "Sync", autogenerate: { directory: "core/sync" } },
            { label: "Timer", autogenerate: { directory: "core/timer" } },
            { label: "Utilities", autogenerate: { directory: "core/utilities" } },
          ],
        },
        {
          label: "Web",
          autogenerate: { directory: "web" },
        },
        // {
        //   label: "Integrations",
        //   autogenerate: { directory: "integrations" },
        // },
        {
          label: "TanStack Query",
          autogenerate: { directory: "tanstack-query" },
        },
        // {
        //   label: "Native",
        //   autogenerate: { directory: "native" },
        // },
      ],
    }),
    mdx(),
    react(),
  ],
});
