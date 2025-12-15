import { generateObject } from "ai"
import path from "path"
import z from "zod"

const systemPrompt = path.join(process.cwd(), "prompt.md")

const pageSchema = z.object({
  slug: z.string().describe('The URL path for the page (e.g., "/", "/about", "/contact"). Must start with "/" and use lowercase with hyphens for multi-word paths.'),
  name: z.string().describe('The display name/title of the page as it should appear in navigation menus and page headers.'),
  displayAsSinglePage: z.boolean().describe('Whether child sections should be rendered as collapsible sections on this page (true) or as separate child pages with their own URLs (false).'),
  sections: z.array(z.string().describe('Title of a content section within this page. Each section represents a distinct topic or content block.')),
  children: z.array(z.object({
    slug: z.string().describe('The URL path for a child page, relative to the parent (e.g., "/services/consulting"). Must start with parent slug.'),
    name: z.string().describe('The display name/title of the child page as it should appear in navigation and headers.')
  }))
})

export async function generateAiSitemap(prompt: string, pagesCount: string = "2-5") {
  const userPrompt = `
    Please generate ${pagesCount} pages.
    ${prompt}
  `;

  const result = await generateObject({
    model: 'google/gemini-2.5-flash',
    system: systemPrompt,
    prompt: userPrompt,
    schema: z.array(pageSchema),
    maxOutputTokens: 3000,
  });

  return result;
}