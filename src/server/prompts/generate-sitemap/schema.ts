import z from "zod";

/**
 * Schema for a child page in the sitemap hierarchy.
 */
export const childPageSchema = z.object({
  slug: z
    .string()
    .describe(
      'URL path for the child page, relative to parent (e.g., "/services/consulting"). Must start with parent slug and use lowercase with hyphens.'
    ),
  name: z
    .string()
    .describe(
      "Display name/title of the child page as shown in navigation and headers."
    ),
});

/**
 * Schema for a top-level page in the sitemap.
 */
export const pageSchema = z.object({
  slug: z
    .string()
    .describe(
      'URL path for the page (e.g., "/", "/about", "/contact"). Must start with "/" and use lowercase with hyphens for multi-word paths.'
    ),
  name: z
    .string()
    .describe(
      "Display name/title of the page as shown in navigation menus and page headers."
    ),
  displayAsSinglePage: z
    .boolean()
    .describe(
      "If true, child sections render as collapsible sections on this page. If false, children are separate pages with their own URLs."
    ),
  sections: z
    .array(
      z
        .string()
        .describe(
          "Title of a content section (e.g., 'Hero', 'Features', 'Testimonials'). Each represents a distinct content block."
        )
    )
    .describe("Ordered list of content sections for this page."),
  children: z
    .array(childPageSchema)
    .describe("Sub-pages nested under this page in the site hierarchy."),
});

/**
 * Schema for a complete sitemap.
 */
export const sitemapSchema = z.array(pageSchema);

/**
 * Inferred types from schemas for use in application code.
 */
export type ChildPage = z.infer<typeof childPageSchema>;
export type Page = z.infer<typeof pageSchema>;
export type Sitemap = z.infer<typeof sitemapSchema>;
