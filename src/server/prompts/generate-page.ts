import { generateObject } from "ai";
import z from 'zod'
import { loadPrompt } from './prompt-loader';

const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(z.object({
    title: z.string().optional(),
    content: z.string().optional(),
  }))
})

export async function generateAiPage(pageTitle: string, businessDescription: string) {
  const systemPrompt = await loadPrompt('generate-page/prompt.md');

  const userPrompt = `
Page Title: ${pageTitle}
Business Description: ${businessDescription}
  `.trim();

  const result = await generateObject({
    model: systemPrompt.metadata.model || 'google/gemini-2.5-pro',
    system: systemPrompt.content,
    prompt: userPrompt,
    schema: pageSchema,
    maxOutputTokens: systemPrompt.metadata.maxTokens || 4000,
  });

  return result;
}
