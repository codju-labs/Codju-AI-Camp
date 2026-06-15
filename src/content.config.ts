import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const levels = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/levels" }),
  schema: z.object({
    title: z.string(),
    sectionCount: z.number().default(1),
  }),
});

export const collections = { levels };
