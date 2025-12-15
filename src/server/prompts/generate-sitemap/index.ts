import { generateObject } from "ai"
import z from "zod"
import { loadPrompt } from '../prompt-loader';

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

export async function generateAiSitemap(userPrompt: string, pagesCount: string = "2-5") {
  const prompt = await loadPrompt('generate-sitemap/prompt.md');
  
  const fullUserPrompt = `
Please generate ${pagesCount} pages.

${userPrompt}
  `.trim();

  const result = await generateObject({
    model: prompt.metadata.model || 'google/gemini-2.5-flash',
    system: prompt.content,
    prompt: fullUserPrompt,
    schema: z.array(pageSchema),
    maxOutputTokens: prompt.metadata.maxTokens || 3000,
  });

  return result;
}