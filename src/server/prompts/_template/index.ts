import { generateText, generateObject } from 'ai';
import { loadPrompt } from '../prompt-loader';
import z from 'zod';

/**
 * Define your output schema if using structured output (generateObject)
 */
const outputSchema = z.object({
  // Define your schema here
  result: z.string(),
  details: z.array(z.string()),
});

/**
 * Define your input types
 */
interface GenerateExampleInput {
  inputData: string;
  context?: string;
}

/**
 * Example: Using generateText for unstructured output
 */
export async function generateExample(input: GenerateExampleInput) {
  // Load the system prompt (static role definition)
  const systemPrompt = await loadPrompt('_template/prompt.md');

  // Construct user prompt with dynamic data
  const userPrompt = `
Input Data: ${input.inputData}
${input.context ? `Context: ${input.context}` : ''}
  `.trim();

  // Use with AI SDK
  const result = await generateText({
    model: systemPrompt.metadata.model || 'google/gemini-2.5-flash',
    system: systemPrompt.content,
    prompt: userPrompt,
    maxTokens: systemPrompt.metadata.maxTokens,
    temperature: systemPrompt.metadata.temperature,
  });

  return result;
}

/**
 * Example: Using generateObject for structured output
 */
export async function generateExampleStructured(input: GenerateExampleInput) {
  const systemPrompt = await loadPrompt('_template/prompt.md');

  const userPrompt = `
Input Data: ${input.inputData}
${input.context ? `Context: ${input.context}` : ''}
  `.trim();

  const result = await generateObject({
    model: systemPrompt.metadata.model || 'google/gemini-2.5-flash',
    system: systemPrompt.content,
    prompt: userPrompt,
    schema: outputSchema,
    maxTokens: systemPrompt.metadata.maxTokens,
  });

  return result;
}
