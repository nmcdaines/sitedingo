import z from "zod";

/**
 * Schema for a content section within a page.
 */
export const sectionSchema = z.object({
  title: z
    .string()
    .describe(
      "Section heading that describes the content block (e.g., 'Our Story', 'How It Works', 'Get in Touch')."
    ),
  content: z
    .string()
    .describe(
      "The main content for this section. Should be 1-3 paragraphs of well-written copy appropriate for the section type."
    ),
  type: z
    .enum([
      "hero",
      "features",
      "benefits",
      "testimonials",
      "cta",
      "content",
      "gallery",
      "pricing",
      "faq",
      "contact",
      "team",
      "process",
      "stats",
    ])
    .optional()
    .describe(
      "The type of section, which can inform layout. If unclear, omit this field."
    ),
});

/**
 * Schema for complete page content.
 */
export const pageContentSchema = z.object({
  title: z
    .string()
    .describe(
      "The page title as it should appear in the browser tab and page header."
    ),
  description: z
    .string()
    .describe(
      "A 1-2 sentence meta description summarizing the page content. Used for SEO and social sharing."
    ),
  sections: z
    .array(sectionSchema)
    .describe(
      "Ordered list of content sections that make up the page. Typically 3-6 sections."
    ),
});

/**
 * Inferred types from schemas.
 */
export type Section = z.infer<typeof sectionSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
