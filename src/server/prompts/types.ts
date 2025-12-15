/**
 * Type definitions for the prompt templating system
 */

/**
 * Supported AI model providers and models
 */
export type AIModel =
  | `google/${string}`
  | `openai/${string}`
  | `anthropic/${string}`
  | string;

/**
 * Configuration options for AI generation
 */
export interface AIGenerationConfig {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Base type for template variables
 * Extend this for specific prompt variable types
 */
export type TemplateVariables = Record<string, string | number | boolean>;

/**
 * Variables for the generate-sitemap prompt
 */
export interface GenerateSitemapVariables {
  businessDescription: string;
  pagesCount?: string;
}

/**
 * Variables for the generate-page prompt
 */
export interface GeneratePageVariables {
  pageTitle: string;
  businessDescription: string;
}

/**
 * Type helper for creating strongly-typed prompt loaders
 * 
 * @example
 * ```ts
 * const loadSitemapPrompt: PromptLoader<GenerateSitemapVariables> = 
 *   (vars) => loadPromptWithVars('generate-sitemap/prompt.md', vars);
 * ```
 */
export type PromptLoader<T extends TemplateVariables> = (
  variables: T
) => Promise<{ content: string; metadata: Record<string, any> }>;

/**
 * Utility type to extract variable names from a template string
 * (For future use with literal type checking)
 */
export type ExtractVariables<T extends string> =
  T extends `${infer _Start}{{${infer Variable}}}${infer Rest}`
    ? Variable | ExtractVariables<Rest>
    : never;
