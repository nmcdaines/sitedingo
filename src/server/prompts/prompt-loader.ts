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
function parseFrontmatter(content: string): { metadata: Record<string, any>; content: string } {
  const frontmatterRegex = /^(?:---|\+{3})\n([\s\S]*?)\n(?:---|\+{3})\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const [, frontmatter, mainContent] = match;
  const metadata: Record<string, any> = {};

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

/**
 * Template variable replacement with type safety
 * Uses double curly braces for variable interpolation: {{variableName}}
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Interpolated string
 * 
 * @example
 * ```ts
 * const text = interpolate(
 *   'Hello {{name}}, you are {{age}} years old',
 *   { name: 'Alice', age: 30 }
 * );
 * // Result: 'Hello Alice, you are 30 years old'
 * ```
 */
export function interpolate<T extends Record<string, any>>(
  template: string,
  variables: T
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in variables) {
      return String(variables[key]);
    }
    // Throw error if variable is missing
    throw new Error(`Missing template variable: ${key}`);
  });
}

/**
 * Type-safe prompt loader with variable interpolation
 * 
 * @param promptPath - Path to the prompt file
 * @param variables - Variables to interpolate into the prompt
 * @returns Parsed prompt with interpolated content
 * 
 * @example
 * ```ts
 * const prompt = await loadPromptWithVars('welcome.md', {
 *   userName: 'Alice',
 *   businessType: 'cafe'
 * });
 * ```
 */
export async function loadPromptWithVars<T extends Record<string, any>>(
  promptPath: string,
  variables: T
): Promise<ParsedPrompt> {
  const prompt = await loadPrompt(promptPath);
  
  return {
    ...prompt,
    content: interpolate(prompt.content, variables),
  };
}

/**
 * Synchronous version of loadPrompt for cases where async is not needed
 * Caches loaded prompts for performance
 */
const promptCache = new Map<string, ParsedPrompt>();

/**
 * Loads a prompt synchronously (uses cached version or throws if not preloaded)
 * Useful for hot paths where prompts should be preloaded at startup
 * 
 * @param promptPath - Path to the prompt file
 * @returns Cached parsed prompt
 */
export function getPromptSync(promptPath: string): ParsedPrompt {
  const cached = promptCache.get(promptPath);
  if (!cached) {
    throw new Error(
      `Prompt not preloaded: ${promptPath}. Call preloadPrompt() first or use loadPrompt() for async loading.`
    );
  }
  return cached;
}

/**
 * Preloads a prompt into the cache for synchronous access
 * 
 * @param promptPath - Path to the prompt file
 * 
 * @example
 * ```ts
 * // At app startup
 * await preloadPrompt('generate-sitemap/prompt.md');
 * 
 * // Later, in a hot path
 * const prompt = getPromptSync('generate-sitemap/prompt.md');
 * ```
 */
export async function preloadPrompt(promptPath: string): Promise<void> {
  const prompt = await loadPrompt(promptPath);
  promptCache.set(promptPath, prompt);
}

/**
 * Clears the prompt cache (useful for testing or hot reloading)
 */
export function clearPromptCache(): void {
  promptCache.clear();
}
