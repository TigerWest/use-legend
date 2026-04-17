// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightCatppuccin from "@catppuccin/starlight";
import { defineConfig } from "astro/config";
import ecTwoSlash from "expressive-code-twoslash";
import { fileURLToPath } from "node:url";
import useLegend from "@usels/vite-plugin";
import { watchDocsPlugin } from "./scripts/vite-plugin-watch-docs";

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
    plugins: [tailwindcss(), useLegend({}), watchDocsPlugin()],
    resolve: {
      alias: [
        {
          find: "@demos",
          replacement: fileURLToPath(new URL("./src/components/demos", import.meta.url)),
        },
        {
          find: "@components",
          replacement: fileURLToPath(new URL("./src/components", import.meta.url)),
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
            {
              label: "Learn",
              items: [
                { label: "Introduction", slug: "guides" },
                { label: "Getting Started", slug: "guides/getting-started" },
                {
                  label: "Observable-First Mental Model",
                  slug: "guides/observable-first-mental-model",
                },
              ],
            },
            {
              label: "Concepts",
              collapsed: true,
              items: [
                { label: "Rendering Boundaries", slug: "guides/concepts/rendering-boundaries" },
                { label: "Auto-Tracking & .get()", slug: "guides/concepts/auto-tracking" },
                {
                  label: "Reactive Refs & Web Targets",
                  slug: "guides/concepts/reactive-refs-and-web-targets",
                },
              ],
            },
            {
              label: "Patterns",
              collapsed: true,
              items: [
                {
                  label: "Derived State & Effects",
                  slug: "guides/patterns/derived-state-and-effects",
                },
                { label: "Data Fetching", slug: "guides/patterns/data-fetching" },
                { label: "TypeScript", slug: "guides/patterns/typescript" },
              ],
            },
            {
              label: "Tooling",
              collapsed: true,
              items: [
                { label: "Vite", slug: "guides/tooling/vite" },
                { label: "Babel / Next.js", slug: "guides/tooling/babel-nextjs" },
                { label: "ESLint", slug: "guides/tooling/eslint" },
              ],
            },
            {
              label: "Use Scope",
              badge: { text: "Experimental", variant: "caution" },
              collapsed: true,
              items: [
                { label: "Introduction", slug: "guides/use-scope" },
                { label: "Scope & Lifecycle", slug: "guides/use-scope/scope-and-lifecycle" },
                {
                  label: "Store & Provider Boundary",
                  slug: "guides/use-scope/store-and-provider-boundary",
                },
                { label: "Effects API", slug: "guides/use-scope/effects-api" },
                { label: "use* vs create*", slug: "guides/use-scope/use-vs-create" },
              ],
            },
          ],
        },
        {
          label: "Core",
          items: [
            { label: "Primitives", autogenerate: { directory: "core/primitives" } },
            { label: "State", collapsed: true, autogenerate: { directory: "core/state" } },
            {
              label: "Reactivity",

              collapsed: true,
              autogenerate: { directory: "core/reactivity" },
            },
            { label: "Observe", collapsed: true, autogenerate: { directory: "core/observe" } },
            { label: "Sync", collapsed: true, autogenerate: { directory: "core/sync" } },
            { label: "Timer", collapsed: true, autogenerate: { directory: "core/timer" } },
            { label: "Utilities", collapsed: true, autogenerate: { directory: "core/utilities" } },
          ],
        },
        {
          label: "Web",
          autogenerate: { directory: "web", collapsed: true },
        },
        // {
        //   label: "Integrations",
        //   autogenerate: { directory: "integrations" },
        // },
        {
          label: "TanStack Query",
          collapsed: true,
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
