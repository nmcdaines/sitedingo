import { generateObject } from "ai";
import z from 'zod'

const systemPrompt = `
You are a website architect specializing in creating clear, user-friendly sitemaps.

Given a specific page title, and the user's description of what their website represents
generate some example content for the given page.
`.trim()

const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(z.object({
    title: z.string().optional(),
    content: z.string().optional(),
  }))
})

export async function generateAiPage(pageTitle: string, description: string) {
  const userPrompt = `
Page: ${pageTitle}
Description: ${description}  
  `.trim()

  const result = await generateObject({
    model: 'google/gemini-2.5-pro',
    system: systemPrompt,
    prompt: userPrompt,
    schema: pageSchema,
    maxOutputTokens: 4000,
  });

  return result;
}
