import { readFile } from 'fs/promises';
import { join, isAbsolute } from 'path';
import z from 'zod';

/**
 * Frontmatter metadata schema for prompt files
 */
const promptMetadataSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  description: z.string().optional(),
});

export type PromptMetadata = z.infer<typeof promptMetadataSchema>;

/**
 * Parsed prompt structure
 */
export interface ParsedPrompt {
  content: string;
  metadata: PromptMetadata;
}

/**
 * Parses YAML frontmatter from markdown content
 * Supports both --- and +++ delimiters
 */
function parseFrontmatter(content: string): { metadata: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^(?:---|\+{3})\n([\s\S]*?)\n(?:---|\+{3})\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const [, frontmatter, mainContent] = match;
  const metadata: Record<string, unknown> = {};

  // Simple YAML parser for key-value pairs
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      const trimmedKey = key.trim();
      
      // Try to parse as number or boolean
      if (value === 'true') metadata[trimmedKey] = true;
      else if (value === 'false') metadata[trimmedKey] = false;
      else if (!isNaN(Number(value))) metadata[trimmedKey] = Number(value);
      else metadata[trimmedKey] = value.replace(/^["']|["']$/g, ''); // Remove quotes
    }
  });

  return { metadata, content: mainContent };
}

/**
 * Loads and parses a prompt file from the prompts directory
 * 
 * @param promptPath - Relative path from src/server/prompts/ or absolute path
 * @returns Parsed prompt with metadata and content
 * 
 * @example
 * ```ts
 * const prompt = await loadPrompt('generate-sitemap/prompt.md');
 * console.log(prompt.metadata.model); // 'google/gemini-2.5-flash'
 * console.log(prompt.content); // The prompt text
 * ```
 */
export async function loadPrompt(promptPath: string): Promise<ParsedPrompt> {
  const basePath = join(process.cwd(), 'src', 'server', 'prompts');
  const fullPath = isAbsolute(promptPath) ? promptPath : join(basePath, promptPath);

  try {
    const content = await readFile(fullPath, 'utf-8');
    const { metadata, content: promptContent } = parseFrontmatter(content);
    
    const validatedMetadata = promptMetadataSchema.parse(metadata);

    return {
      content: promptContent.trim(),
      metadata: validatedMetadata,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Prompt file not found: ${fullPath}`);
    }
    throw error;
  }
}
