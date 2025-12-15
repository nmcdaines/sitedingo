import { generateObject } from "ai";
import z from 'zod'
import { loadPromptWithVars } from './prompt-loader';

const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(z.object({
    title: z.string().optional(),
    content: z.string().optional(),
  }))
})

export async function generateAiPage(pageTitle: string, businessDescription: string) {
  const prompt = await loadPromptWithVars('generate-page/prompt.md', {
    pageTitle,
    businessDescription,
  });

  const result = await generateObject({
    model: prompt.metadata.model || 'google/gemini-2.5-pro',
    system: prompt.content,
    prompt: '', // All context is in the system prompt with variables
    schema: pageSchema,
    maxOutputTokens: prompt.metadata.maxTokens || 4000,
  });

  return result;
}
