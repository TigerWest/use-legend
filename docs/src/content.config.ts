import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

/**
 * Canonical category names allowed in doc frontmatter.
 * Any typo or casing mismatch will fail `astro sync` / `astro dev` / `astro build`
 * with a Zod validation error, so category drift is caught at build/dev time.
 */
const CATEGORIES = [
  // core
  "Primitives",
  "State",
  "Reactivity",
  "Observe",
  "Sync",
  "Timer",
  "Utilities",
  // web
  "Elements",
  "Browser",
  "Sensors",
  // tanstack-query
  "Hooks",
] as const;

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        category: z.enum(CATEGORIES).optional(),
        description: z.string().optional(),
        package: z.enum(["integrations", "core", "web", "native", "tanstack-query"]).optional(),
        sourceFile: z.string().optional(),
        lastChanged: z.coerce.string().optional(),
        contributors: z
          .array(
            z.object({
              name: z.string(),
              email: z.string(),
            })
          )
          .optional(),
      }),
    }),
  }),
};
