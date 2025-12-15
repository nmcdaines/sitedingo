import { generateText } from 'ai';
import { loadPromptWithVars } from '../prompt-loader';
import z from 'zod';

/**
 * Define your output schema if using structured output
 */
const outputSchema = z.object({
  // Define your schema here
  result: z.string(),
});

/**
 * Define your input types
 */
interface GenerateExampleInput {
  variableName: string;
  anotherVariable: string;
}

/**
 * Main function that uses the prompt
 */
export async function generateExample(input: GenerateExampleInput) {
  // Load prompt with variables
  const prompt = await loadPromptWithVars('_template/prompt.md', {
    variableName: input.variableName,
    anotherVariable: input.anotherVariable,
  });

  // Use with AI SDK
  const result = await generateText({
    model: prompt.metadata.model || 'google/gemini-2.5-flash',
    prompt: prompt.content,
    maxTokens: prompt.metadata.maxTokens,
    temperature: prompt.metadata.temperature,
  });

  return result;
}
