import { generateObject } from "ai"
import path from "path"
import z from "zod"

const systemPrompt = path.join(process.cwd(), "prompt.md")

const pageSchema = z.object({
    slug: z.string().describe('The URL path for the page (e.g., "/", "/about", "/contact")'),
    name: z.string().describe('The display name/title of the page'),
    displayAsSinglePage: z.boolean().describe('If the child sections should be displayed as sections on a page or as a new page'),
    sections: z.array(z.string().describe('Title of a section')),
    children: z.array(z.object({
        slug: z.string().describe('The URL path for a child page'),
        name: z.string().describe('The display name/title of the page')
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