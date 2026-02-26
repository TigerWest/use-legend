// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import ecTwoSlash from "expressive-code-twoslash";
import { fileURLToPath } from "node:url";

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@demos/core": fileURLToPath(new URL("../core/src", import.meta.url)),
        "@demos/integrations": fileURLToPath(
          new URL("../integrations/src", import.meta.url),
        ),
      },
    },
  },
  integrations: [
    starlight({
      title: "legendapp-state-utils",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/your-org/legendapp-state-utils",
        },
      ],
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        useStarlightDarkModeSwitch: true,
        useStarlightUiThemeColors: true,
        plugins: [
          ecTwoSlash({
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
        ],
      },
      components: {
        PageTitle: "./src/components/overrides/PageTitle.astro",
      },
      sidebar: [
        {
          label: "Guides",
          items: [{ label: "Example Guide", slug: "guides/example" }],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
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
